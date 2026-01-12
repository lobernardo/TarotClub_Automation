// CANONICAL FOLLOW-UP RULES - IMMUTABLE
// These rules are defined in the PRD and cannot be changed by the UI

import { LeadStage } from '@/types/database';

export type AllowedFollowUpStage = 'captured_form' | 'checkout_started' | 'subscribed_active';

export interface FollowUpRule {
  delay_seconds: number;
  label: string;
}

export const ALLOWED_STAGES: AllowedFollowUpStage[] = [
  'captured_form',
  'checkout_started', 
  'subscribed_active'
];

export const STAGE_LABELS: Record<AllowedFollowUpStage, string> = {
  captured_form: 'Lead Captado',
  checkout_started: 'Checkout Abandonado',
  subscribed_active: 'Onboarding'
};

export const CANONICAL_FOLLOWUPS: Record<AllowedFollowUpStage, FollowUpRule[]> = {
  captured_form: [
    { delay_seconds: 172800, label: 'D+2 (2 dias)' },
    { delay_seconds: 345600, label: 'D+4 (4 dias)' },
    { delay_seconds: 604800, label: 'D+7 (7 dias)' },
    { delay_seconds: 1296000, label: 'D+15 (15 dias)' }
  ],
  checkout_started: [
    { delay_seconds: 1800, label: '+30 minutos' },
    { delay_seconds: 172800, label: 'D+2 (2 dias)' },
    { delay_seconds: 345600, label: 'D+4 (4 dias)' },
    { delay_seconds: 604800, label: 'D+7 (7 dias)' },
    { delay_seconds: 1296000, label: 'D+15 (15 dias)' }
  ],
  subscribed_active: [
    { delay_seconds: 0, label: 'Imediato' },
    { delay_seconds: 60, label: '+1 minuto' }
  ]
};

export function formatDelaySeconds(seconds: number): string {
  if (seconds === 0) return 'Imediato';
  if (seconds < 60) return `${seconds} segundos`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minuto(s)`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hora(s)`;
  return `${Math.floor(seconds / 86400)} dia(s)`;
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
