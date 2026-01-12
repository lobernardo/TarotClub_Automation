/**
 * Message Queue Hook
 * 
 * Manages the message_queue table for follow-up scheduling.
 * 
 * IMPORTANT:
 * - NO message sending
 * - NO cron jobs
 * - Only CRUD operations on the queue
 * - Queue is deterministic and auditable
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage } from '@/types/database';
import { QueuedMessage, QueueStatus, CreateQueueItemData, isProtectedQueueItem } from '@/types/messageQueue';
import { MessageTemplate } from '@/hooks/useMessageTemplates';
import { OnboardingTemplate } from '@/hooks/useOnboardingTemplates';
import { adjustToBusinessHours } from '@/lib/dispatcher';
import { toast } from 'sonner';

type AnyTemplate = MessageTemplate | OnboardingTemplate;

export function useMessageQueue() {
  const [queueItems, setQueueItems] = useState<QueuedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all queue items
  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('message_queue')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (fetchError) {
        console.error('Error fetching queue:', fetchError);
        setError(fetchError.message);
        return;
      }

      setQueueItems((data as QueuedMessage[]) || []);
      setError(null);
    } catch (err) {
      console.error('Error in fetchQueue:', err);
      setError('Erro ao carregar fila de mensagens');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Get queue items for a specific lead
  const getQueueForLead = useCallback((leadId: string): QueuedMessage[] => {
    return queueItems
      .filter(item => item.lead_id === leadId)
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
  }, [queueItems]);

  // Count scheduled items for a template
  const countScheduledForTemplate = useCallback((templateKey: string): number => {
    return queueItems.filter(
      item => item.template_key === templateKey && item.status === 'scheduled'
    ).length;
  }, [queueItems]);

  // Check if a queue item already exists (idempotency check)
  const queueItemExists = useCallback((leadId: string, templateKey: string): boolean => {
    return queueItems.some(
      item => item.lead_id === leadId && 
              item.template_key === templateKey &&
              item.status === 'scheduled'
    );
  }, [queueItems]);

  // Create a single queue item
  const createQueueItem = useCallback(async (data: CreateQueueItemData): Promise<boolean> => {
    // Idempotency check - don't duplicate
    if (queueItemExists(data.lead_id, data.template_key)) {
      console.log(`Queue item already exists for lead ${data.lead_id}, template ${data.template_key}`);
      return true; // Already exists, consider it success
    }

    try {
      const { error: insertError } = await supabase
        .from('message_queue')
        .insert({
          lead_id: data.lead_id,
          template_key: data.template_key,
          stage: data.stage,
          delay_seconds: data.delay_seconds,
          scheduled_for: data.scheduled_for.toISOString(),
          status: 'scheduled' as QueueStatus
        });

      if (insertError) {
        console.error('Error creating queue item:', insertError);
        return false;
      }

      await fetchQueue(); // Refresh
      return true;
    } catch (err) {
      console.error('Error in createQueueItem:', err);
      return false;
    }
  }, [queueItemExists, fetchQueue]);

  // Queue all eligible follow-ups for a lead
  const queueFollowUpsForLead = useCallback(async (
    lead: Lead, 
    templates: AnyTemplate[]
  ): Promise<{ created: number; skipped: number }> => {
    // Filter templates that match the lead's current stage and are active
    const eligibleTemplates = templates.filter(
      t => t.active && t.stage === lead.stage
    );

    if (eligibleTemplates.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const leadCreatedAt = new Date(lead.created_at);
    let created = 0;
    let skipped = 0;

    for (const template of eligibleTemplates) {
      // Check idempotency first
      if (queueItemExists(lead.id, template.template_key)) {
        skipped++;
        continue;
      }

      // Calculate scheduled_for with business hours adjustment
      const rawScheduledTime = new Date(leadCreatedAt.getTime() + template.delay_seconds * 1000);
      const adjustedScheduledTime = adjustToBusinessHours(rawScheduledTime);

      const success = await createQueueItem({
        lead_id: lead.id,
        template_key: template.template_key,
        stage: template.stage as LeadStage,
        delay_seconds: template.delay_seconds,
        scheduled_for: adjustedScheduledTime
      });

      if (success) {
        created++;
      }
    }

    return { created, skipped };
  }, [queueItemExists, createQueueItem]);

  // Cancel pending queue items for a lead (when stage changes)
  const cancelQueueForLead = useCallback(async (
    leadId: string, 
    newStage: LeadStage,
    reason: string = 'stage_changed'
  ): Promise<number> => {
    // Get pending items for this lead
    const pendingItems = queueItems.filter(
      item => item.lead_id === leadId && item.status === 'scheduled'
    );

    if (pendingItems.length === 0) {
      return 0;
    }

    // Filter items that should be canceled (not protected)
    const itemsToCancel = pendingItems.filter(
      item => !isProtectedQueueItem(item.stage, newStage)
    );

    if (itemsToCancel.length === 0) {
      return 0;
    }

    try {
      const canceledAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('message_queue')
        .update({
          status: 'canceled' as QueueStatus,
          canceled_at: canceledAt,
          cancel_reason: reason,
          updated_at: canceledAt
        })
        .in('id', itemsToCancel.map(i => i.id));

      if (updateError) {
        console.error('Error canceling queue items:', updateError);
        return 0;
      }

      await fetchQueue(); // Refresh
      return itemsToCancel.length;
    } catch (err) {
      console.error('Error in cancelQueueForLead:', err);
      return 0;
    }
  }, [queueItems, fetchQueue]);

  // Handle stage change: cancel old queue and create new
  const handleStageChange = useCallback(async (
    lead: Lead,
    newStage: LeadStage,
    templates: AnyTemplate[]
  ): Promise<{ canceled: number; created: number }> => {
    // 1. Cancel pending items for old stage
    const canceled = await cancelQueueForLead(lead.id, newStage, 'stage_changed');

    // 2. Create new queue items for new stage
    const updatedLead: Lead = { ...lead, stage: newStage };
    const { created } = await queueFollowUpsForLead(updatedLead, templates);

    if (canceled > 0 || created > 0) {
      toast.info(
        `Fila atualizada: ${canceled} cancelado(s), ${created} agendado(s)`
      );
    }

    return { canceled, created };
  }, [cancelQueueForLead, queueFollowUpsForLead]);

  // Get summary stats
  const getQueueStats = useCallback(() => {
    const scheduled = queueItems.filter(i => i.status === 'scheduled').length;
    const canceled = queueItems.filter(i => i.status === 'canceled').length;
    const sent = queueItems.filter(i => i.status === 'sent').length;
    return { scheduled, canceled, sent, total: queueItems.length };
  }, [queueItems]);

  return {
    queueItems,
    loading,
    error,
    fetchQueue,
    getQueueForLead,
    countScheduledForTemplate,
    queueItemExists,
    createQueueItem,
    queueFollowUpsForLead,
    cancelQueueForLead,
    handleStageChange,
    getQueueStats
  };
}
