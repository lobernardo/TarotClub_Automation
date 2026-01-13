import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { StageManagementDialog } from "@/components/crm/StageManagementDialog";
import { LeadPredictedFollows } from "@/components/crm/LeadPredictedFollows";
import { LeadMessageQueue } from "@/components/crm/LeadMessageQueue";
import { Lead, LeadStage, CORE_STAGES } from "@/types/database";
import { Search, Filter, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StageBadge } from "@/components/ui/StageBadge";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useOnboardingTemplates } from "@/hooks/useOnboardingTemplates";
import { useMessageQueue } from "@/hooks/useMessageQueue";
import { useLeads } from "@/hooks/useLeads";

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  // 🔗 LEADS REAIS DO SUPABASE
  const { leads, loading } = useLeads();

  // Templates (preview / simulação)
  const { templates: messageTemplates } = useMessageTemplates();
  const { templates: onboardingTemplates } = useOnboardingTemplates();
  const allTemplates = [...messageTemplates, ...onboardingTemplates];

  // Message queue real
  const { queueItems, loading: queueLoading } = useMessageQueue();

  // Agrupar leads por estágio (REAL)
  const leadsByStage: Record<LeadStage, Lead[]> = CORE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((lead) => lead.stage === stage);
      return acc;
    },
    {} as Record<LeadStage, Lead[]>,
  );

  // Filtro por busca
  const filteredLeadsByStage: Record<LeadStage, Lead[]> = CORE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leadsByStage[stage].filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.includes(searchQuery),
      );
      return acc;
    },
    {} as Record<LeadStage, Lead[]>,
  );

  const totalLeads = leads.length;
  const filteredTotal = Object.values(filteredLeadsByStage).flat().length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CRM Kanban</h1>
            <p className="text-muted-foreground mt-1">
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
                className="pl-9 w-64 bg-muted/50 border-border"
              />
            </div>
            <Button variant="outline" size="icon" className="border-border">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-border gap-2" onClick={() => setStageDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Gerenciar Etapas
            </Button>
          </div>
        </div>

        {/* Kanban */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {CORE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={filteredLeadsByStage[stage]}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>
        </div>

        {/* Stage Management */}
        <StageManagementDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} />

        {/* Lead Detail */}
        <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
            {selectedLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl font-serif text-foreground">{selectedLead.name}</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <StageBadge stage={selectedLead.stage} />
                  </div>

                  <div className="glass-card rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{selectedLead.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone</span>
                      <span>{selectedLead.phone}</span>
                    </div>
                  </div>

                  <div className="glass-card rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em</span>
                      <span>
                        {format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {selectedLead.last_interaction_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Última interação</span>
                        <span>
                          {formatDistanceToNow(new Date(selectedLead.last_interaction_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <LeadMessageQueue lead={selectedLead} queueItems={queueItems} loading={queueLoading} />

                  <LeadPredictedFollows lead={selectedLead} templates={allTemplates} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
