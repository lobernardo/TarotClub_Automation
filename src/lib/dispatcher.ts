/**
 * Conceptual Dispatcher for Follow-ups
 * 
 * IMPORTANT: This is a PURE LOGIC module for frontend preview only.
 * - NO message sending
 * - NO cron jobs
 * - NO backend calls
 * - NO persistence
 */

import { Lead } from '@/types/database';
import { MessageTemplate } from '@/hooks/useMessageTemplates';
import { OnboardingTemplate } from '@/hooks/useOnboardingTemplates';
import { 
  BUSINESS_HOURS, 
  TemplateStage, 
  getDelayLabel 
} from '@/constants/followUpRules';

export interface PredictedFollow {
  template_key: string;
  delay_label: string;
  scheduled_raw: Date;
  scheduled_adjusted: Date;
  is_adjusted: boolean;
}

/**
 * Adjusts a date to business hours
 * Rules:
 * - Monday to Saturday only (days 1-6)
 * - 09:00 to 20:00 only
 * - Never Sunday
 * 
 * Examples:
 * - Sunday 14h → Monday 09h
 * - Saturday 22h → Monday 09h
 * - Tuesday 08h → Tuesday 09h
 */
export function adjustToBusinessHours(date: Date): Date {
  const adjusted = new Date(date);
  const dayOfWeek = adjusted.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = adjusted.getHours();
  const minutes = adjusted.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const startHour = parseInt(BUSINESS_HOURS.start.split(':')[0], 10);
  const startMinute = parseInt(BUSINESS_HOURS.start.split(':')[1], 10);
  const endHour = parseInt(BUSINESS_HOURS.end.split(':')[0], 10);
  const endMinute = parseInt(BUSINESS_HOURS.end.split(':')[1], 10);
  
  const startTime = startHour * 60 + startMinute; // 09:00 = 540
  const endTime = endHour * 60 + endMinute; // 20:00 = 1200

  // Check if it's Sunday (0)
  if (dayOfWeek === 0) {
    // Move to Monday 09:00
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(startHour, startMinute, 0, 0);
    return adjusted;
  }

  // Check if current time is before business hours
  if (currentTime < startTime) {
    // Same day at 09:00
    adjusted.setHours(startHour, startMinute, 0, 0);
    return adjusted;
  }

  // Check if current time is after business hours
  if (currentTime >= endTime) {
    // Next valid business day at 09:00
    if (dayOfWeek === 6) {
      // Saturday after 20:00 → Monday 09:00
      adjusted.setDate(adjusted.getDate() + 2);
    } else {
      // Other days → next day 09:00
      adjusted.setDate(adjusted.getDate() + 1);
    }
    adjusted.setHours(startHour, startMinute, 0, 0);
    
    // Recheck if the new day is Sunday
    if (adjusted.getDay() === 0) {
      adjusted.setDate(adjusted.getDate() + 1);
    }
    
    return adjusted;
  }

  // Within business hours, no adjustment needed
  return adjusted;
}

/**
 * Calculate predicted follows for a lead based on active templates
 * 
 * Rules:
 * - Template is eligible if template.stage === lead.stage
 * - Base calculation: lead.created_at + delay_seconds
 * - Always adjust to business hours
 */
export function getPredictedFollows(
  lead: Lead,
  templates: (MessageTemplate | OnboardingTemplate)[]
): PredictedFollow[] {
  const eligibleTemplates = templates.filter(
    t => t.active && t.stage === lead.stage
  );

  if (eligibleTemplates.length === 0) {
    return [];
  }

  const leadCreatedAt = new Date(lead.created_at);
  
  return eligibleTemplates
    .map(template => {
      // Calculate raw scheduled time: created_at + delay_seconds
      const scheduled_raw = new Date(leadCreatedAt.getTime() + template.delay_seconds * 1000);
      
      // Adjust to business hours
      const scheduled_adjusted = adjustToBusinessHours(scheduled_raw);
      
      // Check if adjustment was needed
      const is_adjusted = scheduled_raw.getTime() !== scheduled_adjusted.getTime();

      return {
        template_key: template.template_key,
        delay_label: getDelayLabel(template.stage as TemplateStage, template.delay_seconds),
        scheduled_raw,
        scheduled_adjusted,
        is_adjusted
      };
    })
    .sort((a, b) => a.scheduled_adjusted.getTime() - b.scheduled_adjusted.getTime());
}

/**
 * Count eligible leads for a specific template
 * A lead is eligible if lead.stage === template.stage
 */
export function countEligibleLeads(
  template: MessageTemplate | OnboardingTemplate,
  leads: Lead[]
): number {
  return leads.filter(lead => lead.stage === template.stage).length;
}

/**
 * Get all eligible leads for a specific template
 */
export function getEligibleLeads(
  template: MessageTemplate | OnboardingTemplate,
  leads: Lead[]
): Lead[] {
  return leads.filter(lead => lead.stage === template.stage);
}

/**
 * Format date/time for display in PT-BR
 */
export function formatScheduledDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
