// CANONICAL FOLLOW-UP RULES - IMMUTABLE
// These rules are defined in the PRD and cannot be changed by the UI

export type AllowedFollowUpStage = 'captured_form' | 'checkout_started' | 'subscribed_active' | 'nurture';

export interface FollowUpRule {
  delay_seconds: number;
  label: string;
}

export const ALLOWED_STAGES: AllowedFollowUpStage[] = [
  'captured_form',
  'checkout_started', 
  'subscribed_active',
  'nurture'
];

export const STAGE_LABELS: Record<AllowedFollowUpStage, string> = {
  captured_form: 'Lead Captado',
  checkout_started: 'Checkout Iniciado',
  subscribed_active: 'Assinatura Ativa (Onboarding)',
  nurture: 'Nutrição'
};

export const CANONICAL_FOLLOWUPS: Record<AllowedFollowUpStage, FollowUpRule[]> = {
  captured_form: [
    { delay_seconds: 172800, label: 'D+2' },
    { delay_seconds: 345600, label: 'D+4' },
    { delay_seconds: 604800, label: 'D+7' },
    { delay_seconds: 1296000, label: 'D+15' }
  ],
  checkout_started: [
    { delay_seconds: 1800, label: '+30 minutos' },
    { delay_seconds: 172800, label: 'D+2' },
    { delay_seconds: 345600, label: 'D+4' },
    { delay_seconds: 604800, label: 'D+7' },
    { delay_seconds: 1296000, label: 'D+15' }
  ],
  subscribed_active: [
    { delay_seconds: 0, label: 'Imediato' },
    { delay_seconds: 60, label: '+1 minuto' },
    { delay_seconds: 300, label: '+5 minutos' }
  ],
  nurture: [
    { delay_seconds: 604800, label: 'D+7' },
    { delay_seconds: 1296000, label: 'D+15' },
    { delay_seconds: 2592000, label: 'D+30' }
  ]
};

// Business hours rule (informational only - no backend execution)
export const BUSINESS_HOURS = {
  days: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  start: '09:00',
  end: '20:00'
} as const;

export function formatDelaySeconds(seconds: number): string {
  if (seconds === 0) return 'Imediato';
  if (seconds < 60) return `${seconds} segundos`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minuto(s)`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hora(s)`;
  return `D+${Math.floor(seconds / 86400)}`;
}

export function getDelayLabel(stage: AllowedFollowUpStage, delay_seconds: number): string {
  const rules = CANONICAL_FOLLOWUPS[stage];
  const rule = rules?.find(r => r.delay_seconds === delay_seconds);
  return rule?.label || formatDelaySeconds(delay_seconds);
}

export function isValidFollowUp(stage: string, delay_seconds: number): boolean {
  if (!ALLOWED_STAGES.includes(stage as AllowedFollowUpStage)) {
    return false;
  }
  const rules = CANONICAL_FOLLOWUPS[stage as AllowedFollowUpStage];
  return rules.some(r => r.delay_seconds === delay_seconds);
}

// Generate template_key slug from stage and delay
export function generateTemplateKey(stage: AllowedFollowUpStage, delay_seconds: number): string {
  const label = getDelayLabel(stage, delay_seconds)
    .toLowerCase()
    .replace(/\+/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return `${stage}_${label}`;
}
