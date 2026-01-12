import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanColumn } from '@/components/crm/KanbanColumn';
import { getLeadsByStage, mockLeads } from '@/data/mockData';
import { Lead, LeadStage, STAGE_CONFIG } from '@/types/database';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StageBadge } from '@/components/ui/StageBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Kanban visible stages (main funnel)
const KANBAN_STAGES: LeadStage[] = [
  'captured_form',
  'checkout_started',
  'payment_pending',
  'subscribed_active',
  'subscribed_past_due',
  'nurture'
];

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const leadsByStage = getLeadsByStage();

  // Filter leads by search
  const filteredLeadsByStage = Object.fromEntries(
    Object.entries(leadsByStage).map(([stage, leads]) => [
      stage,
      leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery)
      )
    ])
  ) as Record<LeadStage, Lead[]>;

  const totalLeads = mockLeads.length;
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
            <Button variant="outline" size="icon" className="border-border">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={filteredLeadsByStage[stage]}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>
        </div>

        {/* Lead Detail Sheet */}
        <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
            {selectedLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl font-serif text-foreground">
                    {selectedLead.name}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <StageBadge stage={selectedLead.stage} />
                    {selectedLead.silenced_until && new Date(selectedLead.silenced_until) > new Date() && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-1">
                        🔇 Silenciado
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="glass-card rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Informações de Contato
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-foreground">{selectedLead.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone</span>
                        <span className="text-foreground">{selectedLead.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Origem</span>
                        <span className="text-foreground capitalize">{selectedLead.source || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="glass-card rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Linha do Tempo
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Captado em</span>
                        <span className="text-foreground">
                          {format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {selectedLead.last_interaction_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Última interação</span>
                          <span className="text-foreground">
                            {formatDistanceToNow(new Date(selectedLead.last_interaction_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedLead.notes && (
                    <div className="glass-card rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Observações
                      </h3>
                      <p className="text-foreground">{selectedLead.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      Enviar Mensagem
                    </Button>
                    <Button variant="outline" className="flex-1 border-border">
                      Ver Histórico
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
