import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { StageManagementDialog } from "@/components/crm/StageManagementDialog";
import { LeadPredictedFollows } from "@/components/crm/LeadPredictedFollows";
import { LeadMessageQueue } from "@/components/crm/LeadMessageQueue";

import { useLeads } from "@/hooks/useLeads";
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

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const { templates: messageTemplates } = useMessageTemplates();
  const { templates: onboardingTemplates } = useOnboardingTemplates();
  const allTemplates = [...messageTemplates, ...onboardingTemplates];

  const { queueItems, loading: queueLoading } = useMessageQueue();
  const { leads, leadsByStage } = useLeads();

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
              />
            ))}
          </div>
        </div>

        <StageManagementDialog open={stageDialogOpen} onOpenChange={setStageDialogOpen} />

        <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl">{selectedLead.name}</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <StageBadge stage={selectedLead.stage} />
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
