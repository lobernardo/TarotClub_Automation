/**
 * Hook para métricas de observabilidade do Agente de IA
 * 
 * Fontes de dados:
 * - events: message_received, ai_response (se existir), welcome_sent, group_invite_sent, group_join_confirmed
 * - messages: direction = 'inbound' para mensagens recebidas, is_ai_generated para respostas IA
 * 
 * NOTA: Este hook é somente leitura. Não altera nenhuma regra de negócio.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, Event, Message } from '@/types/database';
import { subDays, subHours, differenceInSeconds, format, parseISO } from 'date-fns';

export type PeriodFilter = '24h' | '7d' | '30d';

export interface AgentKPIs {
  messagesReceived: number;
  aiResponses: number;
  percentWithoutResponse: number;
  avgResponseTimeSeconds: number | null;
  groupInvitesSent: number;
  groupJoinsConfirmed: number;
  welcomesSent: number;
}

export interface InboxHealthItem {
  lead: Lead;
  inboundAt: string;
  secondsSinceInbound: number;
}

export interface AgentResponseItem {
  lead: Lead;
  createdAt: string;
  intent?: string;
  reply?: string;
}

export interface OnboardingActionItem {
  lead: Lead;
  actionType: 'group_invite_sent' | 'group_join_confirmed' | 'welcome_sent';
  createdAt: string;
}

interface UseAgentPerformanceResult {
  kpis: AgentKPIs;
  inboxHealth: InboxHealthItem[];
  recentResponses: AgentResponseItem[];
  onboardingActions: OnboardingActionItem[];
  loading: boolean;
  error: string | null;
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
  refetch: () => Promise<void>;
}

function getFromDate(period: PeriodFilter): Date {
  const now = new Date();
  switch (period) {
    case '24h':
      return subHours(now, 24);
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    default:
      return subDays(now, 7);
  }
}

export function useAgentPerformance(): UseAgentPerformanceResult {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Raw data
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<Map<string, Lead>>(new Map());

  const fromDate = useMemo(() => getFromDate(period), [period]);
  const fromDateISO = useMemo(() => fromDate.toISOString(), [fromDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch events in period
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('created_at', fromDateISO)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.warn('Events table query failed:', eventsError);
        setEvents([]);
      } else {
        setEvents((eventsData || []) as Event[]);
      }

      // Fetch messages in period
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .gte('sent_at', fromDateISO)
        .order('sent_at', { ascending: false });

      if (messagesError) {
        console.warn('Messages table query failed:', messagesError);
        setMessages([]);
      } else {
        setMessages((messagesData || []) as Message[]);
      }

      // Collect all lead IDs
      const leadIds = new Set<string>();
      (eventsData || []).forEach((e: any) => leadIds.add(e.lead_id));
      (messagesData || []).forEach((m: any) => leadIds.add(m.lead_id));

      // Fetch leads data
      if (leadIds.size > 0) {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .in('id', Array.from(leadIds));

        if (!leadsError && leadsData) {
          const leadsMap = new Map<string, Lead>();
          leadsData.forEach((lead: any) => leadsMap.set(lead.id, lead as Lead));
          setLeads(leadsMap);
        }
      } else {
        setLeads(new Map());
      }
    } catch (err) {
      console.error('Error fetching agent performance data:', err);
      setError('Erro ao buscar dados de performance');
    } finally {
      setLoading(false);
    }
  }, [fromDateISO]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute KPIs
  const kpis = useMemo((): AgentKPIs => {
    // Mensagens inbound via messages table (direction = 'inbound')
    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    const messagesReceived = inboundMessages.length;

    // Respostas IA via messages (is_ai_generated = true) OU events (type contains ai)
    const aiResponseMessages = messages.filter(m => m.is_ai_generated);
    const aiResponseEvents = events.filter(e => 
      (e.type as string) === 'ai_response' || 
      (e.type as string).includes('ai')
    );
    const aiResponses = Math.max(aiResponseMessages.length, aiResponseEvents.length);

    // Ações de onboarding
    const groupInvitesSent = events.filter(e => e.type === 'group_invite_sent').length;
    const groupJoinsConfirmed = events.filter(e => e.type === 'group_join_confirmed').length;
    const welcomesSent = events.filter(e => e.type === 'welcome_sent').length;

    // Calcular tempo médio de resposta
    // Pareamos mensagens inbound com respostas IA do mesmo lead
    let totalLatencySeconds = 0;
    let pairedCount = 0;

    const inboundByLead = new Map<string, Message[]>();
    inboundMessages.forEach(m => {
      const existing = inboundByLead.get(m.lead_id) || [];
      existing.push(m);
      inboundByLead.set(m.lead_id, existing);
    });

    const aiResponsesByLead = new Map<string, Message[]>();
    aiResponseMessages.forEach(m => {
      const existing = aiResponsesByLead.get(m.lead_id) || [];
      existing.push(m);
      aiResponsesByLead.set(m.lead_id, existing);
    });

    // Para cada inbound, encontrar a próxima resposta IA
    inboundByLead.forEach((inbounds, leadId) => {
      const responses = aiResponsesByLead.get(leadId) || [];
      
      inbounds.forEach(inbound => {
        const inboundTime = parseISO(inbound.sent_at);
        // Encontrar primeira resposta após o inbound
        const nextResponse = responses
          .filter(r => parseISO(r.sent_at) > inboundTime)
          .sort((a, b) => parseISO(a.sent_at).getTime() - parseISO(b.sent_at).getTime())[0];
        
        if (nextResponse) {
          const latency = differenceInSeconds(parseISO(nextResponse.sent_at), inboundTime);
          if (latency > 0 && latency < 86400) { // Max 24h para ser considerado
            totalLatencySeconds += latency;
            pairedCount++;
          }
        }
      });
    });

    const avgResponseTimeSeconds = pairedCount > 0 
      ? Math.round(totalLatencySeconds / pairedCount) 
      : null;

    // Mensagens sem resposta: inbound sem resposta IA posterior
    const inboundsWithoutResponse = inboundMessages.filter(inbound => {
      const responses = aiResponsesByLead.get(inbound.lead_id) || [];
      const inboundTime = parseISO(inbound.sent_at);
      return !responses.some(r => parseISO(r.sent_at) > inboundTime);
    });

    const percentWithoutResponse = messagesReceived > 0 
      ? Math.round((inboundsWithoutResponse.length / messagesReceived) * 100)
      : 0;

    return {
      messagesReceived,
      aiResponses,
      percentWithoutResponse,
      avgResponseTimeSeconds,
      groupInvitesSent,
      groupJoinsConfirmed,
      welcomesSent,
    };
  }, [messages, events]);

  // Inbox health: mensagens inbound sem resposta
  const inboxHealth = useMemo((): InboxHealthItem[] => {
    const now = new Date();
    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    
    const aiResponsesByLead = new Map<string, Message[]>();
    messages.filter(m => m.is_ai_generated).forEach(m => {
      const existing = aiResponsesByLead.get(m.lead_id) || [];
      existing.push(m);
      aiResponsesByLead.set(m.lead_id, existing);
    });

    const withoutResponse = inboundMessages.filter(inbound => {
      const responses = aiResponsesByLead.get(inbound.lead_id) || [];
      const inboundTime = parseISO(inbound.sent_at);
      return !responses.some(r => parseISO(r.sent_at) > inboundTime);
    });

    return withoutResponse
      .slice(0, 50)
      .map(m => ({
        lead: leads.get(m.lead_id) || {
          id: m.lead_id,
          name: 'Lead não encontrado',
          email: '',
          whatsapp: '',
          stage: 'checkout_started' as const,
          created_at: '',
          updated_at: '',
          last_interaction_at: null,
          silenced_until: null,
          source: null,
          notes: null,
        },
        inboundAt: m.sent_at,
        secondsSinceInbound: differenceInSeconds(now, parseISO(m.sent_at)),
      }))
      .sort((a, b) => b.secondsSinceInbound - a.secondsSinceInbound);
  }, [messages, leads]);

  // Recent AI responses
  const recentResponses = useMemo((): AgentResponseItem[] => {
    const aiResponses = messages.filter(m => m.is_ai_generated);
    
    return aiResponses
      .slice(0, 50)
      .map(m => ({
        lead: leads.get(m.lead_id) || {
          id: m.lead_id,
          name: 'Lead não encontrado',
          email: '',
          whatsapp: '',
          stage: 'checkout_started' as const,
          created_at: '',
          updated_at: '',
          last_interaction_at: null,
          silenced_until: null,
          source: null,
          notes: null,
        },
        createdAt: m.sent_at,
        reply: m.content?.substring(0, 200) || undefined,
      }));
  }, [messages, leads]);

  // Onboarding actions
  const onboardingActions = useMemo((): OnboardingActionItem[] => {
    const actionTypes = ['group_invite_sent', 'group_join_confirmed', 'welcome_sent'] as const;
    const actionEvents = events.filter(e => 
      actionTypes.includes(e.type as typeof actionTypes[number])
    );

    return actionEvents
      .slice(0, 50)
      .map(e => ({
        lead: leads.get(e.lead_id) || {
          id: e.lead_id,
          name: 'Lead não encontrado',
          email: '',
          whatsapp: '',
          stage: 'checkout_started' as const,
          created_at: '',
          updated_at: '',
          last_interaction_at: null,
          silenced_until: null,
          source: null,
          notes: null,
        },
        actionType: e.type as 'group_invite_sent' | 'group_join_confirmed' | 'welcome_sent',
        createdAt: e.created_at,
      }));
  }, [events, leads]);

  return {
    kpis,
    inboxHealth,
    recentResponses,
    onboardingActions,
    loading,
    error,
    period,
    setPeriod,
    refetch: fetchData,
  };
}
