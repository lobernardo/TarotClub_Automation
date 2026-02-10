/**
 * Hook para derivar etapas operacionais do CRM
 *
 * As etapas do CRM são DERIVADAS de leads.stage (enum do banco).
 * O CRM exibe apenas o funil comercial (8 colunas).
 */

import { useMemo } from "react";
import { Lead, LeadStage } from "@/types/database";

// Etapas visuais do CRM (funil comercial — 8 colunas)
export type DerivedCRMStage =
  | "captured_form"        // Lead captado
  | "checkout_started"     // Checkout iniciado
  | "payment_pending"      // Pagamento pendente
  | "cliente_ativo"        // Cliente ativo (subscribed_active)
  | "subscribed_past_due"  // Em atraso
  | "subscribed_canceled"  // Assinatura cancelada
  | "nurture"              // Nutrição
  | "lost_blocked";        // Perdido / Bloqueado

export interface DerivedStageConfig {
  label: string;
  color: string;
  description: string;
  matchesBackendStage: LeadStage[];
}

export const DERIVED_STAGE_CONFIG: Record<DerivedCRMStage, DerivedStageConfig> = {
  captured_form: {
    label: "Lead Captado",
    color: "stage-captured_form",
    description: "Lead preencheu o formulário",
    matchesBackendStage: ["captured_form"],
  },
  checkout_started: {
    label: "Checkout Iniciado",
    color: "stage-checkout_started",
    description: "Lead iniciou checkout",
    matchesBackendStage: ["checkout_started"],
  },
  payment_pending: {
    label: "Pagamento Pendente",
    color: "stage-payment_pending",
    description: "Aguardando confirmação de pagamento",
    matchesBackendStage: ["payment_pending"],
  },
  cliente_ativo: {
    label: "Cliente Ativo",
    color: "stage-subscribed_active",
    description: "Assinatura ativa",
    matchesBackendStage: ["subscribed_active"],
  },
  subscribed_past_due: {
    label: "Em Atraso",
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
  lost_blocked: {
    label: "Perdido / Bloqueado",
    color: "stage-lost",
    description: "Lead perdido ou bloqueado",
    matchesBackendStage: ["lost", "blocked"],
  },
};

// Ordem das colunas no Kanban
export const DERIVED_CRM_STAGES: DerivedCRMStage[] = [
  "captured_form",
  "checkout_started",
  "payment_pending",
  "cliente_ativo",
  "subscribed_past_due",
  "subscribed_canceled",
  "nurture",
  "lost_blocked",
];

export interface LeadWithDerivedStage extends Lead {
  derivedStage: DerivedCRMStage;
}

/**
 * Mapeia lead.stage do banco → coluna visual do CRM
 */
export function deriveCRMStage(lead: Lead): DerivedCRMStage {
  const { stage } = lead;

  const mapping: Record<LeadStage, DerivedCRMStage> = {
    captured_form: "captured_form",
    checkout_started: "checkout_started",
    lead_captured: "captured_form",       // leads WhatsApp → mesma coluna "Lead Captado"
    agent_captured: "captured_form",      // leads IA → mesma coluna "Lead Captado"
    conectado: "checkout_started",        // conectado → checkout (funil comercial)
    payment_pending: "payment_pending",
    subscribed_active: "cliente_ativo",
    subscribed_onboarding: "cliente_ativo", // onboarding → cliente ativo no CRM
    subscribed_past_due: "subscribed_past_due",
    subscribed_canceled: "subscribed_canceled",
    nurture: "nurture",
    lost: "lost_blocked",
    blocked: "lost_blocked",
  };

  return mapping[stage] || "captured_form";
}

/**
 * Agrupa leads por coluna derivada (para uso no Kanban)
 */
export function groupLeadsByDerivedStage(
  leads: Lead[],
): Record<DerivedCRMStage, LeadWithDerivedStage[]> {
  const grouped: Record<DerivedCRMStage, LeadWithDerivedStage[]> = {
    captured_form: [],
    checkout_started: [],
    payment_pending: [],
    cliente_ativo: [],
    subscribed_past_due: [],
    subscribed_canceled: [],
    nurture: [],
    lost_blocked: [],
  };

  leads.forEach((lead) => {
    const derivedStage = deriveCRMStage(lead);
    grouped[derivedStage].push({ ...lead, derivedStage });
  });

  return grouped;
}
