import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DerivedKanbanColumn } from "@/components/crm/DerivedKanbanColumn";
import { StageManagementDialog } from "@/components/crm/StageManagementDialog";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";

import { useLeads } from "@/hooks/useLeads";
import { useLeadData } from "@/hooks/useLeadData";
import { useLeadActions } from "@/hooks/useLeadActions";
import { Lead, LeadStage, Event } from "@/types/database";
import { 
  useDerivedStages, 
  groupLeadsByDerivedStage, 
  DERIVED_CRM_STAGES, 
  DerivedCRMStage,
  LeadWithDerivedStage 
} from "@/hooks/useDerivedStages";

import { Search, Filter, Settings2, UserPlus, Kanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eventsByLead, setEventsByLead] = useState<Map<string, Event[]>>(new Map());

  const { leads, refetch: refetchLeads } = useLeads();
  const { fetchLeadsWithEvents } = useDerivedStages(leads);
  
  const {
    events,
    messages,
    queueItems,
    subscription,
    loading: leadDataLoading,
  } = useLeadData(selectedLead?.id || null);
  
  const { changeStage } = useLeadActions(() => {
    refetchLeads();
    if (selectedLead) {
      const updatedLead = leads.find((l) => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
  });

  // Buscar eventos para derivação quando leads mudam
  const loadEventsForDerivation = useCallback(async () => {
    if (leads.length > 0) {
      const eventsMap = await fetchLeadsWithEvents();
      setEventsByLead(eventsMap);
    }
  }, [leads, fetchLeadsWithEvents]);

  useEffect(() => {
    loadEventsForDerivation();
  }, [loadEventsForDerivation]);

  // Agrupar leads por etapa derivada
  const leadsByDerivedStage = groupLeadsByDerivedStage(leads, eventsByLead);

  // Filtrar leads por busca
  const filteredLeadsByDerivedStage = Object.fromEntries(
    Object.entries(leadsByDerivedStage).map(([stage, stageLeads]) => [
      stage,
      stageLeads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.whatsapp.includes(searchQuery),
      ),
    ]),
  ) as Record<DerivedCRMStage, LeadWithDerivedStage[]>;

  const totalLeads = leads.length;
  const filteredTotal = Object.values(filteredLeadsByDerivedStage).flat().length;

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    await changeStage(leadId, newStage);
    // Recarregar eventos após mudança de stage
    await loadEventsForDerivation();
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, stage: newStage });
    }
  };

  const handleLeadDrop = async (leadId: string, fromStage: LeadStage, toStage: LeadStage) => {
    await changeStage(leadId, toStage);
    await loadEventsForDerivation();
  };

  const handleLeadCreated = () => {
    refetchLeads();
  };

  const handleLeadUpdated = () => {
    refetchLeads();
    loadEventsForDerivation();
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
            {DERIVED_CRM_STAGES.map((derivedStage, index) => (
              <div 
                key={derivedStage} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DerivedKanbanColumn
                  derivedStage={derivedStage}
                  leads={filteredLeadsByDerivedStage[derivedStage] || []}
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