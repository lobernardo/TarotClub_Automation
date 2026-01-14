/**
 * Hook for lead actions (stage change, etc.)
 * Uses existing Supabase tables
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadStage } from '@/types/database';
import { toast } from 'sonner';

export function useLeadActions(onUpdate?: () => void) {
  // Change lead stage
  const changeStage = useCallback(async (leadId: string, newStage: LeadStage): Promise<boolean> => {
    try {
      // Get current stage for event logging
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('stage')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('Error fetching lead:', fetchError);
        toast.error('Erro ao buscar lead');
        return false;
      }

      const oldStage = lead.stage;

      // Update lead stage
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          stage: newStage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('Error updating lead stage:', updateError);
        toast.error(`Erro ao atualizar estágio: ${updateError.message}`);
        return false;
      }

      // Try to log event (table may not exist)
      try {
        await supabase.from('events').insert({
          lead_id: leadId,
          type: 'stage_changed' as any, // May not be in enum, will fail silently
          payload: {
            from: oldStage,
            to: newStage,
            manual: true,
          },
        });
      } catch (eventErr) {
        console.log('Could not log stage change event:', eventErr);
      }

      // Cancel scheduled messages for old stage
      try {
        await supabase
          .from('message_queue')
          .update({
            status: 'canceled',
            cancel_reason: 'stage_changed',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('lead_id', leadId)
          .eq('status', 'scheduled')
          .eq('stage', oldStage);
      } catch (queueErr) {
        console.log('Could not cancel queue items:', queueErr);
      }

      toast.success('Estágio atualizado com sucesso');
      onUpdate?.();
      return true;
    } catch (err) {
      console.error('Error in changeStage:', err);
      toast.error('Erro ao atualizar estágio');
      return false;
    }
  }, [onUpdate]);

  return {
    changeStage,
  };
}
