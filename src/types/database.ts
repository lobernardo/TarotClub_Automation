// Types matching existing Supabase schema

// LEAD STAGES - Single source of truth (PRD complete - 11 stages)
export type LeadStage =
  | "captured_form"
  | "checkout_started"
  | "conectado"
  | "payment_pending"
  | "subscribed_active"
  | "subscribed_onboarding"
  | "subscribed_past_due"
  | "subscribed_canceled"
  | "nurture"
  | "lost"
  | "blocked"
  | "lead_captured";

// All backend stages (for type compatibility)
export const ALL_STAGES: LeadStage[] = [
  "captured_form",
  "checkout_started",
  "conectado",
  "payment_pending",
  "subscribed_active",
  "subscribed_onboarding",
  "subscribed_past_due",
  "subscribed_canceled",
  "nurture",
  "lost",
  "blocked",
  "lead_captured",
];

// Visible stages for Kanban display (frontend only - excludes captured_form)
export const CORE_STAGES: LeadStage[] = [
  "checkout_started",
  "lead_captured",
  "conectado",
  "payment_pending",
  "subscribed_active",
  "subscribed_onboarding",
  "subscribed_past_due",
  "subscribed_canceled",
  "nurture",
  "lost",
  "blocked",
];

export type EventType =
  | "form_submitted"
  | "checkout_started"
  | "payment_created"
  | "payment_confirmed"
  | "follow_sent"
  | "message_received"
  | "silence_applied"
  | "welcome_sent"
  | "group_invite_sent"
  | "group_join_confirmed"
  | "appointment_requested"
  | "appointment_confirmed"
  | "stage_changed";

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  stage: LeadStage;
  created_at: string;
  updated_at: string;
  last_interaction_at: string | null;
  silenced_until: string | null;
  source: string | null;
  notes: string | null;
}

export interface Event {
  id: string;
  lead_id: string;
  type: EventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  direction: "inbound" | "outbound";
  content: string;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  template_id: string | null;
  is_ai_generated: boolean;
}

export interface FollowUpRule {
  id: string;
  stage: LeadStage;
  delay_hours: number;
  template_id: string;
  is_active: boolean;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  stage: LeadStage | null;
  created_at: string;
  updated_at: string;
}

// Appointment status matching database constraint
export type AppointmentStatus = "requested" | "confirmed" | "canceled";

export interface Appointment {
  id: string;
  lead_id: string;
  status: AppointmentStatus;
  starts_at: string;
  ends_at: string | null;
  google_calendar_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Appointment with joined lead data (for UI display)
export interface AppointmentWithLead extends Appointment {
  lead: {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    stage: LeadStage;
  } | null;
}

export interface Subscription {
  id: string;
  lead_id: string;
  asaas_subscription_id: string | null;
  status: "active" | "past_due" | "canceled" | "pending";
  started_at: string;
  canceled_at: string | null;
}

// Stage metadata for UI - ALL PRD STAGES
// Color classes must match CSS classes in index.css (e.g., stage-captured_form)
export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; description: string; isCore: boolean }> = {
  captured_form: {
    label: "Lead Captado",
    color: "stage-captured_form",
    description: "Lead preencheu o formulário",
    isCore: true,
  },
  checkout_started: {
    label: "Lead Capturado – Checkout Aberto",
    color: "stage-checkout_started",
    description: "Iniciou o checkout",
    isCore: true,
  },
  conectado: {
    label: "Conectado",
    color: "stage-conectado",
    description: "Lead em conversa ativa com o suporte",
    isCore: true,
  },
  payment_pending: {
    label: "Pagamento Pendente",
    color: "stage-payment_pending",
    description: "Pagamento criado, aguardando confirmação",
    isCore: true,
  },
  subscribed_active: {
    label: "Cliente Ativo",
    color: "stage-subscribed_active",
    description: "Cliente confirmou entrada no grupo",
    isCore: true,
  },
  subscribed_onboarding: {
    label: "Onboarding Enviado",
    color: "stage-subscribed_onboarding",
    description: "Link do grupo enviado, aguardando confirmação",
    isCore: true,
  },
  subscribed_past_due: {
    label: "Assinatura Atrasada",
    color: "stage-subscribed_past_due",
    description: "Pagamento atrasado",
    isCore: true,
  },
  subscribed_canceled: {
    label: "Assinatura Cancelada",
    color: "stage-subscribed_canceled",
    description: "Assinatura cancelada",
    isCore: true,
  },
  nurture: {
    label: "Nutrição",
    color: "stage-nurture",
    description: "Em nutrição de conteúdo",
    isCore: true,
  },
  lost: {
    label: "Perdido",
    color: "stage-lost",
    description: "Lead perdido",
    isCore: true,
  },
  blocked: {
    label: "Bloqueado",
    color: "stage-blocked",
    description: "Não contatar",
    isCore: true,
  },
  lead_captured: {
    label: "Lead Capturado (WhatsApp)",
    color: "stage-lead_captured",
    description: "Lead chegou direto pelo WhatsApp, aguardando dados",
    isCore: true,
  },
};
