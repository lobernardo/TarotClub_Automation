import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStage, CORE_STAGES } from "@/types/database";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar leads:", error);
      setLeads([]);
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  }

  const leadsByStage: Record<LeadStage, Lead[]> = CORE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((lead) => lead.stage === stage);
      return acc;
    },
    {} as Record<LeadStage, Lead[]>
  );

  return {
    leads,
    leadsByStage,
    loading,
    refetch: fetchLeads,
  };
}
