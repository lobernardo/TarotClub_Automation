/**
 * Hook para derivar etapas operacionais do CRM
 *
 * As etapas do CRM são DERIVADAS de:
 * - lead.stage (enum do banco)
 * - eventos do lead (events)
 *
 * Isso permite visualização operacional sem alterar o modelo de dados.
 */

import { useMemo, useCallback } from "react";
import { Lead, LeadStage, Event, EventType } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

// Etapas operacionais derivadas para o CRM
export type DerivedCRMStage =
  | "checkout_started" // checkout_started
  | "lead_captured"
  | "conectado" // conectado
  | "payment_pending" // payment_pending
  | "onboarding" // subscribed_active SEM evento group_invite_sent
  | "onboarding_sent" // subscribed_onboarding OU subscribed_active COM group_invite_sent
  | "cliente_ativo" // subscribed_active COM group_join_confirmed
  | "subscribed_past_due" // subscribed_past_due
  | "subscribed_canceled" // subscribed_canceled
  | "nurture" // nurture
  | "lost" // lost
  | "blocked"; // blocked

export interface DerivedStageConfig {
  label: string;
  color: string;
  description: string;
  matchesBackendStage: LeadStage[];
}

export const DERIVED_STAGE_CONFIG: Record<DerivedCRMStage, DerivedStageConfig> = {
  checkout_started: {
    label: "Checkout Iniciado",
    color: "stage-checkout_started",
    description: "Lead iniciou checkout",
    matchesBackendStage: ["checkout_started"],
  },
  lead_captured: {
    label: "Lead Capturado",
    color: "stage-lead_captured",
    description: "Lead iniciou pelo Whatsapp",
    matchesBackendStage: ["lead_captured"],
  },
  conectado: {
    label: "Conectado",
    color: "stage-conectado",
    description: "Em conversa ativa com suporte",
    matchesBackendStage: ["conectado"],
  },
  payment_pending: {
    label: "Pagamento Pendente",
    color: "stage-payment_pending",
    description: "Aguardando confirmação de pagamento",
    matchesBackendStage: ["payment_pending"],
  },
  onboarding: {
    label: "Onboarding",
    color: "stage-subscribed_active",
    description: "Pagou, aguardando envio do link do grupo",
    matchesBackendStage: ["subscribed_active"],
  },
  onboarding_sent: {
    label: "Onboarding Enviado",
    color: "stage-subscribed_onboarding",
    description: "Link do grupo enviado, aguardando confirmação",
    matchesBackendStage: ["subscribed_onboarding", "subscribed_active"],
  },
  cliente_ativo: {
    label: "Cliente Ativo",
    color: "stage-subscribed_active",
    description: "Cliente confirmou entrada no grupo",
    matchesBackendStage: ["subscribed_active"],
  },
  subscribed_past_due: {
    label: "Assinatura Atrasada",
    color: "stage-subscribed_past_due",
    description: "Pagamento atrasado",
    matchesBackendStage: ["subscribed_past_due"],
  },
  subscribed_canceled: {
    label: "Assinatura Cancelada",
    color: "stage-subscribed_canceled",
    description: "Assinatura cancelada",
    matchesBackendStage: ["subscribed_canceled"],
  },
  nurture: {
    label: "Nutrição",
    color: "stage-nurture",
    description: "Em nutrição de conteúdo",
    matchesBackendStage: ["nurture"],
  },
  lost: {
    label: "Perdido",
    color: "stage-lost",
    description: "Lead perdido",
    matchesBackendStage: ["lost"],
  },
  blocked: {
    label: "Bloqueado",
    color: "stage-blocked",
    description: "Não contatar",
    matchesBackendStage: ["blocked"],
  },
};

// Ordem das etapas derivadas no Kanban
export const DERIVED_CRM_STAGES: DerivedCRMStage[] = [
  "checkout_started",
  "lead_captured",
  "conectado",
  "payment_pending",
  "onboarding",
  "onboarding_sent",
  "cliente_ativo",
  "subscribed_past_due",
  "subscribed_canceled",
  "nurture",
  "lost",
  "blocked",
];

export interface LeadWithDerivedStage extends Lead {
  derivedStage: DerivedCRMStage;
}

/**
 * Deriva a etapa operacional do CRM com base no stage + eventos do lead
 */
export function deriveCRMStage(lead: Lead, leadEvents: Event[]): DerivedCRMStage {
  const { stage } = lead;

  // Estágios que mapeiam diretamente
  const directMappings: Partial<Record<LeadStage, DerivedCRMStage>> = {
    checkout_started: "checkout_started",
    lead_captured: "lead_captured",
    conectado: "conectado",
    payment_pending: "payment_pending",
    subscribed_past_due: "subscribed_past_due",
    subscribed_canceled: "subscribed_canceled",
    nurture: "nurture",
    lost: "lost",
    blocked: "blocked",
  };

  if (directMappings[stage]) {
    return directMappings[stage]!;
  }

  // Verificar eventos para subscribed_active e subscribed_onboarding
  const hasGroupInviteSent = leadEvents.some((e) => e.type === "group_invite_sent");
  const hasGroupJoinConfirmed = leadEvents.some((e) => e.type === "group_join_confirmed");

  // subscribed_onboarding sempre = onboarding_sent
  if (stage === "subscribed_onboarding") {
    return "onboarding_sent";
  }

  // subscribed_active depende dos eventos
  if (stage === "subscribed_active") {
    if (hasGroupJoinConfirmed) {
      return "cliente_ativo";
    }
    if (hasGroupInviteSent) {
      return "onboarding_sent";
    }
    return "onboarding";
  }

  // captured_form não aparece no CRM visual, mapeia para checkout se chegar aqui
  if (stage === "captured_form") {
    return "checkout_started";
  }

  // Fallback (não deve acontecer)
  return "checkout_started";
}

/**
 * Hook principal para usar etapas derivadas no CRM
 */
export function useDerivedStages(leads: Lead[]) {
  // Busca eventos de todos os leads para derivar as etapas
  const fetchLeadsWithEvents = useCallback(async (): Promise<Map<string, Event[]>> => {
    if (leads.length === 0) return new Map();

    const leadIds = leads.map((l) => l.id);

    // Buscar apenas eventos relevantes para derivação (group_invite_sent, group_join_confirmed)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .in("lead_id", leadIds)
      .in("type", ["group_invite_sent", "group_join_confirmed"] as EventType[]);

    if (error) {
      console.error("Erro ao buscar eventos para derivação:", error);
      return new Map();
    }

    // Agrupar eventos por lead_id
    const eventsByLead = new Map<string, Event[]>();
    (data || []).forEach((event) => {
      const existing = eventsByLead.get(event.lead_id) || [];
      existing.push(event as Event);
      eventsByLead.set(event.lead_id, existing);
    });

    return eventsByLead;
  }, [leads]);

  return {
    fetchLeadsWithEvents,
    deriveCRMStage,
    DERIVED_CRM_STAGES,
    DERIVED_STAGE_CONFIG,
  };
}

/**
 * Agrupa leads por etapa derivada (para uso no Kanban)
 */
export function groupLeadsByDerivedStage(
  leads: Lead[],
  eventsByLead: Map<string, Event[]>,
): Record<DerivedCRMStage, LeadWithDerivedStage[]> {
  const grouped: Record<DerivedCRMStage, LeadWithDerivedStage[]> = {
    checkout_started: [],
    lead_captured: [],
    conectado: [],
    payment_pending: [],
    onboarding: [],
    onboarding_sent: [],
    cliente_ativo: [],
    subscribed_past_due: [],
    subscribed_canceled: [],
    nurture: [],
    lost: [],
    blocked: [],
  };

  leads.forEach((lead) => {
    const events = eventsByLead.get(lead.id) || [];
    const derivedStage = deriveCRMStage(lead, events);

    grouped[derivedStage].push({
      ...lead,
      derivedStage,
    });
  });

  return grouped;
}
