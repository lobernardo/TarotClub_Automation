// Types matching existing Supabase schema

export type LeadStage = 
  | 'captured_form'
  | 'checkout_started'
  | 'payment_pending'
  | 'subscribed_active'
  | 'subscribed_past_due'
  | 'subscribed_canceled'
  | 'nurture'
  | 'lost'
  | 'blocked';

export type EventType =
  | 'form_submitted'
  | 'checkout_started'
  | 'payment_created'
  | 'payment_confirmed'
  | 'follow_sent'
  | 'message_received'
  | 'silence_applied'
  | 'welcome_sent'
  | 'group_invite_sent'
  | 'appointment_requested'
  | 'appointment_confirmed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  direction: 'inbound' | 'outbound';
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

export interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  lead_id: string;
  asaas_subscription_id: string | null;
  status: 'active' | 'past_due' | 'canceled' | 'pending';
  started_at: string;
  canceled_at: string | null;
}

// Stage metadata for UI
export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; description: string }> = {
  captured_form: {
    label: 'Captado',
    color: 'stage-captured',
    description: 'Lead preencheu o formulário'
  },
  checkout_started: {
    label: 'Checkout',
    color: 'stage-checkout',
    description: 'Iniciou o checkout'
  },
  payment_pending: {
    label: 'Aguardando',
    color: 'stage-pending',
    description: 'Pagamento pendente'
  },
  subscribed_active: {
    label: 'Ativo',
    color: 'stage-active',
    description: 'Assinatura ativa'
  },
  subscribed_past_due: {
    label: 'Atrasado',
    color: 'stage-past-due',
    description: 'Pagamento em atraso'
  },
  subscribed_canceled: {
    label: 'Cancelado',
    color: 'stage-canceled',
    description: 'Assinatura cancelada'
  },
  nurture: {
    label: 'Nutrição',
    color: 'stage-nurture',
    description: 'Em nutrição de conteúdo'
  },
  lost: {
    label: 'Perdido',
    color: 'stage-lost',
    description: 'Lead perdido'
  },
  blocked: {
    label: 'Bloqueado',
    color: 'stage-blocked',
    description: 'Não contatar'
  }
};
