/**
 * Hook for lead actions (stage change, update, delete)
 * Uses existing Supabase tables
 *
 * IMPORTANT:
 * - deleteLead cancels queue items but does NOT trigger automations
 * - updateLead only updates basic fields (name, email, whatsapp)
 *
 * RULE (canonical):
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadStage } from "@/types/database";
import { toast } from "sonner";
import { normalizeWhatsapp } from "@/lib/utils";

// Type for updateable lead fields
export interface UpdateLeadData {
  name?: string;
  email?: string | null;
  whatsapp?: string | null;
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

        if (fetchError || !lead) {
          console.error("Error fetching lead:", fetchError);
          toast.error("Erro ao buscar lead");
          return false;
        }

        const oldStage = lead.stage as LeadStage;

        // No-op guard (avoid unnecessary writes + cancellations)
        if (oldStage === newStage) {
          toast.message("Lead já está neste estágio");
          return true;
        }

        // Use a single timestamp for consistency across updates/logs/cancel
        const stageChangedAt = new Date().toISOString();

        // Update lead stage
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            stage: newStage,
            updated_at: stageChangedAt,
          })
          .eq("id", leadId);

        if (updateError) {
          console.error("Error updating lead stage:", updateError);
          toast.error(`Erro ao atualizar estágio: ${updateError.message}`);
          return false;
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
        if (data.email !== undefined) {
          updateData.email = data.email ? data.email.trim().toLowerCase() : null;
        }
        if (data.whatsapp !== undefined) {
          updateData.whatsapp = data.whatsapp ? normalizeWhatsapp(data.whatsapp) : null;
        }
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
   * IMPORTANT: This is a destructive operation
   */
  const deleteLead = useCallback(
    async (leadId: string): Promise<boolean> => {
      try {
        // Delete the lead
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
