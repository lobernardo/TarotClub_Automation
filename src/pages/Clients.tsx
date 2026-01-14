import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClients } from '@/hooks/useClients';
import { useLeadData } from '@/hooks/useLeadData';
import { useLeadActions } from '@/hooks/useLeadActions';
import { Lead, LeadStage, STAGE_CONFIG } from '@/types/database';
import { LeadDetailSheet } from '@/components/crm/LeadDetailSheet';
import { StageBadge } from '@/components/ui/StageBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserCheck, Mail, Phone, Calendar, List, LayoutGrid, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Client stages for Kanban
const CLIENT_STAGES: LeadStage[] = ['subscribed_active', 'subscribed_past_due', 'subscribed_canceled'];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const { clients, clientsByStatus, loading, refetch } = useClients();
  const { events, messages, queueItems, subscription, loading: clientDataLoading } = useLeadData(selectedClient?.id || null);
  const { changeStage } = useLeadActions(() => {
    refetch();
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const filteredByStatus = {
    active: filteredClients.filter(c => c.stage === 'subscribed_active'),
    past_due: filteredClients.filter(c => c.stage === 'subscribed_past_due'),
    canceled: filteredClients.filter(c => c.stage === 'subscribed_canceled'),
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

  const ClientCard = ({ client, onClick }: { client: Lead; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer animate-fade-in"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
          <StageBadge stage={client.stage} className="mt-1" />
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold">
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{client.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Membro desde {format(new Date(client.created_at), "MMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {client.last_interaction_at && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Última interação: {formatDistanceToNow(new Date(client.last_interaction_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </p>
        </div>
      )}

      {client.notes && (
        <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
          <p className="text-xs text-primary">{client.notes}</p>
        </div>
      )}
    </div>
  );

  const KanbanColumn = ({ stage, clients }: { stage: LeadStage; clients: Lead[] }) => (
    <div className="kanban-column min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('stage-badge', STAGE_CONFIG[stage].color)}>
            {STAGE_CONFIG[stage].label}
          </span>
          <span className="text-xs text-muted-foreground">
            {clients.length}
          </span>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum cliente neste status
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onClick={() => setSelectedClient(client)} 
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeCount} ativos • {pastDueCount} atrasados • {canceledCount} cancelados
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-muted/50 border-border"
              />
            </div>

            <div className="flex border border-border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              /* List View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onClick={() => setSelectedClient(client)} 
                  />
                ))}
              </div>
            ) : (
              /* Kanban View */
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {CLIENT_STAGES.map((stage) => (
                    <KanbanColumn 
                      key={stage} 
                      stage={stage} 
                      clients={filteredByStatus[stage === 'subscribed_active' ? 'active' : stage === 'subscribed_past_due' ? 'past_due' : 'canceled']} 
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredClients.length === 0 && (
              <div className="text-center py-12 glass-card rounded-xl">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Tente buscar por outro termo' : 'Os clientes aparecerão aqui quando houver assinantes'}
                </p>
              </div>
            )}
          </>
        )}

        <LeadDetailSheet
          lead={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
          events={events}
          messages={messages}
          queueItems={queueItems}
          subscription={subscription}
          loading={clientDataLoading}
          onStageChange={handleStageChange}
        />
      </div>
    </AppLayout>
  );
}
