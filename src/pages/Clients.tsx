import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClients } from "@/hooks/useClients";
import { useLeadActions } from "@/hooks/useLeadActions";
import { Lead, LeadStage, STAGE_CONFIG } from "@/types/database";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { StageBadge } from "@/components/ui/StageBadge";
import { Search, UserCheck, Mail, MessageSquare, Calendar, List, LayoutGrid, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Client stages for Kanban
const CLIENT_STAGES: LeadStage[] = ["subscribed_active", "subscribed_past_due", "subscribed_canceled"];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const { clients, clientsByStatus, loading, refetch } = useClients();
  const { changeStage } = useLeadActions(() => {
    refetch();
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  });

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.whatsapp || "").includes(searchQuery),
  );

  const filteredByStatus = {
    active: filteredClients.filter((c) => c.stage === "subscribed_active"),
    past_due: filteredClients.filter((c) => c.stage === "subscribed_past_due"),
    canceled: filteredClients.filter((c) => c.stage === "subscribed_canceled"),
  };

  const activeCount = clientsByStatus.active.length;
  const pastDueCount = clientsByStatus.past_due.length;
  const canceledCount = clientsByStatus.canceled.length;

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    await changeStage(leadId, newStage);
    if (selectedClient && selectedClient.id === leadId) {
      setSelectedClient({ ...selectedClient, stage: newStage });
    }
  };

  const ClientCard = ({ client, onClick }: { client: Lead; onClick: () => void }) => {
    const initials = client.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        onClick={onClick}
        className="glass-card p-5 cursor-pointer animate-scale-in"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{client.name}</h3>
            <StageBadge stage={client.stage} className="mt-2" />
          </div>
          <div className="avatar-premium h-11 w-11 text-sm flex-shrink-0">
            {initials}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{client.email || "Email não informado"}</span>
          </div>
          {client.whatsapp && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span>{client.whatsapp}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Membro desde {format(new Date(client.created_at), "MMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>

      </div>
    );
  };

  const KanbanColumn = ({ stage, clients }: { stage: LeadStage; clients: Lead[] }) => {
    const getStageAccent = (stage: LeadStage): string => {
      const accents: Record<string, string> = {
        subscribed_active: "bg-success",
        subscribed_past_due: "bg-warning",
        subscribed_canceled: "bg-destructive",
      };
      return accents[stage] || "bg-accent";
    };

    return (
      <div className="kanban-column min-w-[300px] max-w-[340px]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-1 h-5 rounded-full", getStageAccent(stage))} />
            <span className="font-semibold text-foreground text-sm">{STAGE_CONFIG[stage].label}</span>
          </div>
          <span className="count-badge">{clients.length}</span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
              Nenhum cliente
            </div>
          ) : (
            clients.map((client, index) => (
              <div key={client.id} style={{ animationDelay: `${index * 30}ms` }}>
                <ClientCard client={client} onClick={() => setSelectedClient(client)} />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-accent" />
              </div>
              <span className="heading-display">Clientes</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              <span className="text-success font-medium">{activeCount} ativos</span>
              <span className="mx-2">•</span>
              <span className="text-warning font-medium">{pastDueCount} atrasados</span>
              <span className="mx-2">•</span>
              <span className="text-destructive font-medium">{canceledCount} cancelados</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-card border-border"
              />
            </div>

            <div className="flex border border-border rounded-lg bg-card overflow-hidden">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("kanban")}
                className="rounded-none border-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {viewMode === "list" ? (
              /* List View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClients.map((client, index) => (
                  <div key={client.id} style={{ animationDelay: `${index * 30}ms` }}>
                    <ClientCard client={client} onClick={() => setSelectedClient(client)} />
                  </div>
                ))}
              </div>
            ) : (
              /* Kanban View */
              <div className="overflow-x-auto pb-4 -mx-2 px-2">
                <div className="flex gap-5 min-w-max">
                  {CLIENT_STAGES.map((stage, index) => (
                    <div 
                      key={stage}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <KanbanColumn
                        stage={stage}
                        clients={
                          filteredByStatus[
                            stage === "subscribed_active"
                              ? "active"
                              : stage === "subscribed_past_due"
                                ? "past_due"
                                : "canceled"
                          ]
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredClients.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon inline-block">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? "Tente buscar por outro termo ou limpar o filtro."
                    : "Os clientes aparecerão aqui quando houver assinantes ativos no Clube do Tarot."}
                </p>
              </div>
            )}
          </>
        )}

        <LeadDetailSheet
          lead={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
          onStageChange={handleStageChange}
        />
      </div>
    </AppLayout>
  );
}
