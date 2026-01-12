/**
 * Message Queue Types
 * 
 * Represents the message_queue table structure for follow-up scheduling
 */

import { LeadStage } from './database';

// Queue item status enum
export type QueueStatus = 'scheduled' | 'canceled' | 'sent';

// Core queue item interface (matches Supabase table)
export interface QueuedMessage {
  id: string;
  lead_id: string;
  template_key: string;
  stage: LeadStage;
  delay_seconds: number;
  scheduled_for: string; // ISO datetime
  status: QueueStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
}

// Data for creating a new queue item
export interface CreateQueueItemData {
  lead_id: string;
  template_key: string;
  stage: LeadStage;
  delay_seconds: number;
  scheduled_for: Date;
}

// Stages that should NOT have their queue canceled on stage change
export const PRESERVE_QUEUE_STAGES: LeadStage[] = [
  'subscribed_active', // onboarding messages should continue
  'nurture'            // nurture messages should continue
];

// Check if a stage should preserve its queue on change
export function shouldPreserveQueue(fromStage: LeadStage, toStage: LeadStage): boolean {
  // If moving TO onboarding or nurture, don't cancel those specific stage messages
  // But if leaving, cancel the old stage messages
  return false; // Default: cancel all pending when stage changes
}

// Check if queue item belongs to a protected category for a stage
export function isProtectedQueueItem(itemStage: LeadStage, currentLeadStage: LeadStage): boolean {
  // Onboarding messages are protected if lead is in subscribed_active
  if (itemStage === 'subscribed_active' && currentLeadStage === 'subscribed_active') {
    return true;
  }
  // Nurture messages are protected if lead is in nurture
  if (itemStage === 'nurture' && currentLeadStage === 'nurture') {
    return true;
  }
  return false;
}
