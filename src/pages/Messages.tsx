import { AppLayout } from '@/components/layout/AppLayout';
import { mockMessages, mockLeads } from '@/data/mockData';
import { MessageSquare, Send, Clock, CheckCheck, Eye, Bot, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Messages() {
  const messagesWithLead = mockMessages.map(msg => ({
    ...msg,
    lead: mockLeads.find(l => l.id === msg.lead_id)
  }));

  const pendingMessages = messagesWithLead.filter(m => 
    m.direction === 'outbound' && !m.delivered_at
  );

  const deliveredMessages = messagesWithLead.filter(m => 
    m.direction === 'outbound' && m.delivered_at
  );

  const inboundMessages = messagesWithLead.filter(m => m.direction === 'inbound');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Fila de Mensagens
          </h1>
          <p className="text-muted-foreground mt-1">
            Mensagens enviadas e recebidas via WhatsApp
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{pendingMessages.length}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{deliveredMessages.length}</p>
              <p className="text-sm text-muted-foreground">Entregues</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{inboundMessages.length}</p>
              <p className="text-sm text-muted-foreground">Recebidas</p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Histórico de Mensagens</h2>
          </div>
          <div className="divide-y divide-border">
            {messagesWithLead.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'p-4 hover:bg-muted/30 transition-colors',
                  message.direction === 'inbound' && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    message.direction === 'outbound'
                      ? message.is_ai_generated
                        ? 'bg-purple-500/10'
                        : 'bg-primary/10'
                      : 'bg-secondary'
                  )}>
                    {message.direction === 'outbound' ? (
                      message.is_ai_generated ? (
                        <Bot className="h-5 w-5 text-purple-500" />
                      ) : (
                        <Send className="h-5 w-5 text-primary" />
                      )
                    ) : (
                      <User className="h-5 w-5 text-secondary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {message.direction === 'outbound' ? 'Veranah Alma' : message.lead?.name}
                      </span>
                      {message.is_ai_generated && (
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                          IA
                        </span>
                      )}
                      {message.template_id && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Template
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.sent_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <p className="text-foreground/90 text-sm">{message.content}</p>
                    
                    {/* Delivery status for outbound */}
                    {message.direction === 'outbound' && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {message.delivered_at && (
                          <span className="flex items-center gap-1">
                            <CheckCheck className="h-3 w-3 text-emerald-500" />
                            Entregue
                          </span>
                        )}
                        {message.read_at && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-primary" />
                            Lido
                          </span>
                        )}
                        {!message.delivered_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                            Pendente
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
