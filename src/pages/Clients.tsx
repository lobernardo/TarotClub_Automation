import { AppLayout } from '@/components/layout/AppLayout';
import { mockLeads } from '@/data/mockData';
import { StageBadge } from '@/components/ui/StageBadge';
import { Search, UserCheck, Mail, Phone, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter only active subscribers
  const activeClients = mockLeads.filter(lead => 
    lead.stage === 'subscribed_active' || 
    lead.stage === 'subscribed_past_due'
  );

  const filteredClients = activeClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Clientes Ativos
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredClients.length} assinantes no Clube do Tarot
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-muted/50 border-border"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
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
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Tente buscar por outro termo' : 'Os clientes ativos aparecerão aqui'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
