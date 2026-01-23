/**
 * Hook for lead actions (stage change, update, delete)
 * Uses existing Supabase tables
 *
 * IMPORTANT:
 * - deleteLead cancels queue items but does NOT trigger automations
 * - updateLead only updates basic fields (name, email, whatsapp, notes)
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStage } from "@/types/database";
import { toast } from "sonner";
import { normalizeWhatsapp } from "@/lib/utils";

// Type for updateable lead fields
export interface UpdateLeadData {
  name?: string;
  email?: string;
  whatsapp?: string;
  notes?: string | null;
}

export function useLeadActions(onUpdate?: () => void) {
  // Change lead stage
  const changeStage = useCallback(
    async (leadId: string, newStage: LeadStage): Promise<boolean> => {
      try {
        // Get current stage for event logging
        const { data: lead, error: fetchError } = await supabase
          .from("leads")
          .select("stage")
          .eq("id", leadId)
          .single();

        if (fetchError) {
          console.error("Error fetching lead:", fetchError);
          toast.error("Erro ao buscar lead");
          return false;
        }

        const oldStage = lead.stage;

        // Update lead stage
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            stage: newStage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        if (updateError) {
          console.error("Error updating lead stage:", updateError);
          toast.error(`Erro ao atualizar estágio: ${updateError.message}`);
          return false;
        }

        // Try to log event (table may not exist)
        try {
          await supabase.from("events").insert({
            lead_id: leadId,
            type: "stage_changed" as any,
            payload: {
              from: oldStage,
              to: newStage,
              manual: true,
            },
          });
        } catch (eventErr) {
          console.log("Could not log stage change event:", eventErr);
        }

        // CANONICAL RULE: Cancel checkout follow-ups ONLY when leaving checkout_started
        // This protects onboarding messages (created AFTER stage change to subscribed_active)
        if (oldStage === 'checkout_started' && newStage !== 'checkout_started') {
          const stageChangedAt = new Date().toISOString();
          
          try {
            // Cancel all scheduled messages created BEFORE the stage change
            // Onboarding messages are safe because they're created AFTER this point
            const { error: cancelError, count } = await supabase
              .from("message_queue")
              .update({
                status: "canceled",
                cancel_reason: `exited_checkout_started_to_${newStage}`,
                canceled_at: stageChangedAt,
                updated_at: stageChangedAt,
              })
              .eq("lead_id", leadId)
              .eq("status", "scheduled")
              .lte("created_at", stageChangedAt);
            
            if (cancelError) {
              console.error("Error canceling checkout follow-ups:", cancelError);
            } else {
              console.log(`Canceled ${count ?? 'unknown'} checkout follow-ups for lead ${leadId}`);
            }
          } catch (queueErr) {
            console.log("Could not cancel queue items:", queueErr);
          }
        }

        toast.success("Estágio atualizado com sucesso");
        onUpdate?.();
        return true;
      } catch (err) {
        console.error("Error in changeStage:", err);
        toast.error("Erro ao atualizar estágio");
        return false;
      }
    },
    [onUpdate],
  );

  /**
   * Update lead basic fields
   * Does NOT trigger any automations
   */
  const updateLead = useCallback(
    async (leadId: string, data: UpdateLeadData): Promise<boolean> => {
      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        // Only include provided fields
        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
        if (data.whatsapp !== undefined) updateData.whatsapp = normalizeWhatsapp(data.whatsapp);
        if (data.notes !== undefined) updateData.notes = data.notes;

        const { error: updateError } = await supabase.from("leads").update(updateData).eq("id", leadId);

        if (updateError) {
          console.error("Error updating lead:", updateError);
          toast.error(`Erro ao atualizar lead: ${updateError.message}`);
          return false;
        }

        toast.success("Lead atualizado com sucesso");
        onUpdate?.();
        return true;
      } catch (err) {
        console.error("Error in updateLead:", err);
        toast.error("Erro ao atualizar lead");
        return false;
      }
    },
    [onUpdate],
  );

  /**
   * Delete lead (hard delete)
   * Cancels all pending queue items but does NOT trigger automations
   * IMPORTANT: This is a destructive operation
   */
  const deleteLead = useCallback(
    async (leadId: string): Promise<boolean> => {
      try {
        // 1. Cancel all pending queue items (without triggering automations)
        // This is a silent cleanup, not an automation trigger
        try {
          await supabase
            .from("message_queue")
            .update({
              status: "canceled",
              cancel_reason: "lead_deleted",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("lead_id", leadId)
            .eq("status", "scheduled");
        } catch (queueErr) {
          console.log("Could not cancel queue items:", queueErr);
          // Continue with deletion even if queue cancel fails
        }

        // 2. Delete the lead
        const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId);

        if (deleteError) {
          console.error("Error deleting lead:", deleteError);
          toast.error(`Erro ao excluir lead: ${deleteError.message}`);
          return false;
        }

        toast.success("Lead excluído com sucesso");
        onUpdate?.();
        return true;
      } catch (err) {
        console.error("Error in deleteLead:", err);
        toast.error("Erro ao excluir lead");
        return false;
      }
    },
    [onUpdate],
  );

  return {
    changeStage,
    updateLead,
    deleteLead,
  };
}
