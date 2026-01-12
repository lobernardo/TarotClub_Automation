// CANONICAL FOLLOW-UP RULES - IMMUTABLE
// These rules are defined in the PRD and cannot be changed by the UI

// Stages allowed for SALES follow-ups only
export type SalesFollowUpStage = 'captured_form' | 'checkout_started';

// Stage for ONBOARDING only
export type OnboardingStage = 'subscribed_active';

// All stages that can have templates
export type AllowedFollowUpStage = SalesFollowUpStage | OnboardingStage;

export interface FollowUpRule {
  delay_seconds: number;
  label: string;
}

// Sales stages for Templates page
export const SALES_STAGES: SalesFollowUpStage[] = [
  'captured_form',
  'checkout_started'
];

// Onboarding stage for Onboarding page
export const ONBOARDING_STAGES: OnboardingStage[] = [
  'subscribed_active'
];

export const SALES_STAGE_LABELS: Record<SalesFollowUpStage, string> = {
  captured_form: 'Lead Captado',
  checkout_started: 'Checkout Iniciado'
};

export const ONBOARDING_STAGE_LABELS: Record<OnboardingStage, string> = {
  subscribed_active: 'Assinatura Ativa (Onboarding)'
};

// Combined labels for backward compatibility
export const STAGE_LABELS: Record<AllowedFollowUpStage, string> = {
  ...SALES_STAGE_LABELS,
  ...ONBOARDING_STAGE_LABELS
};

// Canonical delays for SALES
export const SALES_FOLLOWUPS: Record<SalesFollowUpStage, FollowUpRule[]> = {
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
  ]
};

// Canonical delays for ONBOARDING
export const ONBOARDING_FOLLOWUPS: Record<OnboardingStage, FollowUpRule[]> = {
  subscribed_active: [
    { delay_seconds: 0, label: 'Imediato' },
    { delay_seconds: 60, label: '+1 minuto' },
    { delay_seconds: 300, label: '+5 minutos' }
  ]
};

// Combined for backward compatibility
export const CANONICAL_FOLLOWUPS: Record<AllowedFollowUpStage, FollowUpRule[]> = {
  ...SALES_FOLLOWUPS,
  ...ONBOARDING_FOLLOWUPS
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

export function isValidSalesFollowUp(stage: string, delay_seconds: number): boolean {
  if (!SALES_STAGES.includes(stage as SalesFollowUpStage)) {
    return false;
  }
  const rules = SALES_FOLLOWUPS[stage as SalesFollowUpStage];
  return rules.some(r => r.delay_seconds === delay_seconds);
}

export function isValidOnboardingFollowUp(stage: string, delay_seconds: number): boolean {
  if (!ONBOARDING_STAGES.includes(stage as OnboardingStage)) {
    return false;
  }
  const rules = ONBOARDING_FOLLOWUPS[stage as OnboardingStage];
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
