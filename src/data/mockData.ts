import { Lead, Event, Message, LeadStage, CORE_STAGES } from '@/types/database';

// Mock data for UI development - will be replaced by Supabase queries
export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '11999887766',
    stage: 'captured_form',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: null,
    silenced_until: null,
    source: 'landing_page',
    notes: null
  },
  {
    id: '2',
    name: 'Ana Santos',
    email: 'ana.santos@email.com',
    phone: '11988776655',
    stage: 'checkout_started',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'instagram',
    notes: null
  },
  {
    id: '3',
    name: 'Carla Oliveira',
    email: 'carla@email.com',
    phone: '11977665544',
    stage: 'checkout_started',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: 'Interessada no plano anual'
  },
  {
    id: '4',
    name: 'Juliana Costa',
    email: 'juliana@email.com',
    phone: '11966554433',
    stage: 'subscribed_active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'referral',
    notes: null
  },
  {
    id: '5',
    name: 'Patricia Lima',
    email: 'patricia@email.com',
    phone: '11955443322',
    stage: 'subscribed_active',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: 'VIP - muito engajada'
  },
  {
    id: '6',
    name: 'Fernanda Rocha',
    email: 'fernanda@email.com',
    phone: '11944332211',
    stage: 'nurture',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: null
  },
  {
    id: '7',
    name: 'Camila Dias',
    email: 'camila@email.com',
    phone: '11933221100',
    stage: 'nurture',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: 'Pediu para parar de receber ofertas'
  },
  {
    id: '8',
    name: 'Beatriz Alves',
    email: 'beatriz@email.com',
    phone: '11922110099',
    stage: 'captured_form',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: null,
    silenced_until: null,
    source: 'instagram',
    notes: null
  },
  {
    id: '9',
    name: 'Renata Mendes',
    email: 'renata@email.com',
    phone: '11911009988',
    stage: 'checkout_started',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: null,
    silenced_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    source: 'landing_page',
    notes: null
  },
  {
    id: '10',
    name: 'Gabriela Nunes',
    email: 'gabriela@email.com',
    phone: '11900998877',
    stage: 'lost',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: 'Não respondeu após D+15'
  },
  {
    id: '11',
    name: 'Sofia Martins',
    email: 'sofia@email.com',
    phone: '11899887766',
    stage: 'blocked',
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_interaction_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    silenced_until: null,
    source: 'landing_page',
    notes: 'Pediu para não ser contatada'
  }
];

export const mockEvents: Event[] = [
  {
    id: '1',
    lead_id: '1',
    type: 'form_submitted',
    payload: { source: 'landing_page' },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    lead_id: '1',
    type: 'follow_sent',
    payload: { template: 'welcome_d2' },
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    lead_id: '2',
    type: 'checkout_started',
    payload: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    lead_id: '4',
    type: 'payment_confirmed',
    payload: { amount: 97.00 },
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    lead_id: '4',
    type: 'welcome_sent',
    payload: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 60 * 1000).toISOString()
  },
  {
    id: '6',
    lead_id: '4',
    type: 'group_invite_sent',
    payload: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 120 * 1000).toISOString()
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    lead_id: '2',
    direction: 'outbound',
    content: 'Oi Ana! Vi que você começou a se inscrever no Clube do Tarot... ✨',
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
    read_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    template_id: 'checkout_30min',
    is_ai_generated: false
  },
  {
    id: '2',
    lead_id: '2',
    direction: 'inbound',
    content: 'Oi! Sim, ainda estou pensando. É que não sei se vale a pena...',
    sent_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    delivered_at: null,
    read_at: null,
    template_id: null,
    is_ai_generated: false
  },
  {
    id: '3',
    lead_id: '2',
    direction: 'outbound',
    content: 'Entendo perfeitamente! Posso te contar um pouco mais sobre o que você vai ter acesso?',
    sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date(Date.now() - 1 * 60 * 60 * 1000 + 3000).toISOString(),
    read_at: null,
    template_id: null,
    is_ai_generated: true
  }
];

// Dashboard metrics
export const dashboardMetrics = {
  totalLeads: mockLeads.length,
  activeClients: mockLeads.filter(l => l.stage === 'subscribed_active').length,
  conversionRate: 20,
  pendingFollowUps: 5,
  messagesThisWeek: 34,
  appointmentsThisWeek: 3
};

// Leads grouped by stage for Kanban - using CORE_STAGES only
export function getLeadsByStage(): Record<LeadStage, Lead[]> {
  return CORE_STAGES.reduce((acc, stage) => {
    acc[stage] = mockLeads.filter(lead => lead.stage === stage);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);
}
