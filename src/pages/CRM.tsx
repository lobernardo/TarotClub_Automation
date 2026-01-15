import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { StageManagementDialog } from "@/components/crm/StageManagementDialog";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";

import { useLeads } from "@/hooks/useLeads";
import { useLeadData } from "@/hooks/useLeadData";
import { useLeadActions } from "@/hooks/useLeadActions";
import { Lead, LeadStage, CORE_STAGES } from "@/types/database";

import { Search, Filter, Settings2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { leads, leadsByStage, refetch: refetchLeads } = useLeads();
  const { events, messages, queueItems, subscription, loading: leadDataLoading } = useLeadData(selectedLead?.id || null);
  const { changeStage } = useLeadActions(() => {
    refetchLeads();
    // Refetch the selected lead data
    if (selectedLead) {
      const updatedLead = leads.find(l => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
  });

  const filteredLeadsByStage = Object.fromEntries(
    Object.entries(leadsByStage).map(([stage, stageLeads]) => [
      stage,
      stageLeads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.includes(searchQuery),
      ),
    ]),
  ) as Record<LeadStage, Lead[]>;

  const totalLeads = leads.length;
  const filteredTotal = Object.values(filteredLeadsByStage).flat().length;

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    await changeStage(leadId, newStage);
    // Update selected lead with new stage
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, stage: newStage });
    }
  };

  const handleLeadDrop = async (leadId: string, fromStage: LeadStage, toStage: LeadStage) => {
    // Only call changeStage - it already handles event logging and queue cancellation
    await changeStage(leadId, toStage);
  };

  const handleLeadCreated = () => {
    refetchLeads();
  };

  const handleLeadUpdated = () => {
    refetchLeads();
    // Refetch the selected lead data to show updates
    if (selectedLead) {
      setTimeout(() => {
        const updatedLead = leads.find(l => l.id === selectedLead.id);
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM Kanban</h1>
            <p className="text-muted-foreground">
              {filteredTotal} de {totalLeads} leads
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setStageDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Gerenciar Etapas
            </Button>

            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {CORE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={filteredLeadsByStage[stage] || []}
                onLeadClick={setSelectedLead}
                onLeadDrop={handleLeadDrop}
              />
            ))}
          </div>
        </div>

        <StageManagementDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} />

        <CreateLeadDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleLeadCreated}
        />

        <LeadDetailSheet
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          events={events}
          messages={messages}
          queueItems={queueItems}
          subscription={subscription}
          loading={leadDataLoading}
          onStageChange={handleStageChange}
          onLeadUpdated={handleLeadUpdated}
          onLeadDeleted={handleLeadDeleted}
        />
      </div>
    </AppLayout>
  );
}
