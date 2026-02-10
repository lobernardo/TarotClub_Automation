import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DerivedKanbanColumn } from "@/components/crm/DerivedKanbanColumn";
import { StageManagementDialog } from "@/components/crm/StageManagementDialog";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";

import { useLeads } from "@/hooks/useLeads";
import { useLeadActions } from "@/hooks/useLeadActions";
import { Lead, LeadStage } from "@/types/database";
import {
  DerivedCRMStage,
  DERIVED_CRM_STAGES,
  groupLeadsByDerivedStage,
  LeadWithDerivedStage,
} from "@/hooks/useDerivedStages";

import { Search, Filter, Settings2, UserPlus, Kanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Map derived stages to their primary backend stage for drag-and-drop
const DERIVED_TO_BACKEND_STAGE: Record<DerivedCRMStage, LeadStage> = {
  captured_form: "captured_form",
  checkout_started: "checkout_started",
  payment_pending: "payment_pending",
  cliente_ativo: "subscribed_active",
  subscribed_past_due: "subscribed_past_due",
  subscribed_canceled: "subscribed_canceled",
  nurture: "nurture",
  lost_blocked: "lost",
};

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { leads, refetch: refetchLeads } = useLeads();

  const { changeStage } = useLeadActions(() => {
    refetchLeads();
    if (selectedLead) {
      const updatedLead = leads.find((l) => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
  });

  // Group leads by derived stage (no events needed anymore)
  const leadsByDerivedStage = useMemo(
    () => groupLeadsByDerivedStage(leads),
    [leads]
  );

  // Filter leads by search
  const filteredLeadsByStage = useMemo(() => {
    if (!searchQuery.trim()) return leadsByDerivedStage;

    const query = searchQuery.toLowerCase();
    return Object.fromEntries(
      Object.entries(leadsByDerivedStage).map(([stage, stageLeads]) => [
        stage,
        stageLeads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(query) ||
            (lead.email || "").toLowerCase().includes(query) ||
            (lead.whatsapp || "").includes(searchQuery)
        ),
      ])
    ) as Record<DerivedCRMStage, LeadWithDerivedStage[]>;
  }, [leadsByDerivedStage, searchQuery]);

  const totalLeads = leads.length;
  const filteredTotal = Object.values(filteredLeadsByStage).flat().length;

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    await changeStage(leadId, newStage);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, stage: newStage });
    }
  };

  const handleLeadDrop = async (leadId: string, _fromStage: LeadStage, toDerivedStage: DerivedCRMStage) => {
    const backendStage = DERIVED_TO_BACKEND_STAGE[toDerivedStage];
    await changeStage(leadId, backendStage);
  };

  const handleLeadCreated = () => {
    refetchLeads();
  };

  const handleLeadUpdated = () => {
    refetchLeads();
    if (selectedLead) {
      setTimeout(() => {
        const updatedLead = leads.find((l) => l.id === selectedLead.id);
        if (updatedLead) {
          setSelectedLead(updatedLead);
        }
      }, 100);
    }
  };

  const handleLeadDeleted = () => {
    setSelectedLead(null);
    refetchLeads();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <Kanban className="h-5 w-5 text-accent" />
              </div>
              <span className="heading-display">CRM Kanban</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              {filteredTotal} de {totalLeads} leads
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-card border-border"
              />
            </div>

            <Button variant="outline" size="icon" className="border-border bg-card hover:bg-secondary">
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-border bg-card hover:bg-secondary"
              onClick={() => setStageDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar Etapas</span>
            </Button>

            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Lead</span>
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-5 min-w-max">
            {DERIVED_CRM_STAGES.map((stage, index) => (
              <div key={stage} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <DerivedKanbanColumn
                  stage={stage}
                  leads={filteredLeadsByStage[stage] || []}
                  onLeadClick={setSelectedLead}
                  onLeadDrop={handleLeadDrop}
                />
              </div>
            ))}
          </div>
        </div>

        <StageManagementDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} />
        <CreateLeadDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={handleLeadCreated} />
        <LeadDetailSheet
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          onStageChange={handleStageChange}
          onLeadUpdated={handleLeadUpdated}
          onLeadDeleted={handleLeadDeleted}
        />
      </div>
    </AppLayout>
  );
}
