/**
 * Lead Detail Sheet Component
 * Shows complete lead information including:
 * - Lead data (name, email, phone, source, stage, notes)
 * - Interaction history (events, messages, queue items)
 * - Stage change action
 * - Edit and delete actions
 */

import { useState } from 'react';
import { Lead, LeadStage, STAGE_CONFIG, CORE_STAGES, Event, Message } from '@/types/database';
import { QueuedMessage } from '@/types/messageQueue';
import { Subscription } from '@/types/database';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StageBadge } from '@/components/ui/StageBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditLeadDialog } from './EditLeadDialog';
import { DeleteLeadDialog } from './DeleteLeadDialog';
import { 
  Mail, Phone, Calendar, MapPin, Clock, MessageCircle, 
  ArrowRight, FileText, CreditCard, Bell, User, ArrowRightLeft,
  Send, CheckCircle, XCircle, AlertCircle, Pencil, Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  messages: Message[];
  queueItems: QueuedMessage[];
  subscription: Subscription | null;
  loading: boolean;
  onStageChange?: (leadId: string, newStage: LeadStage) => Promise<void>;
  onLeadUpdated?: () => void;
  onLeadDeleted?: () => void;
}

// Event type labels
const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  form_submitted: { label: 'Formulário enviado', icon: <FileText className="h-4 w-4" /> },
  checkout_started: { label: 'Checkout iniciado', icon: <CreditCard className="h-4 w-4" /> },
  payment_created: { label: 'Pagamento criado', icon: <CreditCard className="h-4 w-4" /> },
  payment_confirmed: { label: 'Pagamento confirmado', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  follow_sent: { label: 'Follow-up enviado', icon: <Send className="h-4 w-4" /> },
  message_received: { label: 'Mensagem recebida', icon: <MessageCircle className="h-4 w-4" /> },
  silence_applied: { label: 'Silêncio aplicado', icon: <Bell className="h-4 w-4" /> },
  welcome_sent: { label: 'Boas-vindas enviada', icon: <Send className="h-4 w-4 text-green-500" /> },
  group_invite_sent: { label: 'Convite de grupo', icon: <User className="h-4 w-4" /> },
  appointment_requested: { label: 'Agendamento solicitado', icon: <Calendar className="h-4 w-4" /> },
  appointment_confirmed: { label: 'Agendamento confirmado', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  stage_changed: { label: 'Estágio alterado', icon: <ArrowRightLeft className="h-4 w-4" /> },
};

// Source labels
const SOURCE_LABELS: Record<string, string> = {
  landing_page: 'Landing Page',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Indicação',
  manual: 'Cadastro Manual',
  facebook: 'Facebook',
  google: 'Google Ads',
  other: 'Outro',
};

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  events,
  messages,
  queueItems,
  subscription,
  loading,
  onStageChange,
  onLeadUpdated,
  onLeadDeleted
}: LeadDetailSheetProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  if (!lead) return null;

  const createdAt = new Date(lead.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR });

  // Filter queue items for this lead
  const leadQueueItems = queueItems.filter(item => item.lead_id === lead.id);
  const scheduledCount = leadQueueItems.filter(i => i.status === 'scheduled').length;
  const sentCount = leadQueueItems.filter(i => i.status === 'sent').length;

  // Combine and sort timeline items
  const timelineItems = [
    ...events.map(e => ({
      type: 'event' as const,
      data: e,
      date: new Date(e.created_at),
    })),
    ...messages.map(m => ({
      type: 'message' as const,
      data: m,
      date: new Date(m.sent_at),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleStageChange = async (newStage: string) => {
    if (onStageChange && newStage !== lead.stage) {
      await onStageChange(lead.id, newStage as LeadStage);
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    onLeadUpdated?.();
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    onOpenChange(false); // Close the sheet
    onLeadDeleted?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-2xl">{lead.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <StageBadge stage={lead.stage} />
                  {lead.silenced_until && new Date(lead.silenced_until) > new Date() && (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                      🔇 Silenciado
                    </Badge>
                  )}
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditDialogOpen(true)}
                  title="Editar lead"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  title="Excluir lead"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Lead Data Section */}
            <div className="glass-card rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Lead
              </h3>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{lead.email}</span>
              </div>

              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{lead.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Criado: {format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{timeAgo}</span>
              </div>

              {lead.source && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Origem: {SOURCE_LABELS[lead.source] || lead.source}
                  </span>
                </div>
              )}

              {lead.last_interaction_at && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Última interação: {formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {lead.notes && (
              <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Subscription Info (if exists) */}
          {subscription && (
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Assinatura
              </h3>
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline" 
                  className={cn(
                    subscription.status === 'active' && 'bg-green-500/10 text-green-400 border-green-500/30',
                    subscription.status === 'past_due' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    subscription.status === 'canceled' && 'bg-red-500/10 text-red-400 border-red-500/30',
                    subscription.status === 'pending' && 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                  )}
                >
                  {subscription.status === 'active' && 'Ativa'}
                  {subscription.status === 'past_due' && 'Atrasada'}
                  {subscription.status === 'canceled' && 'Cancelada'}
                  {subscription.status === 'pending' && 'Pendente'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Desde {format(new Date(subscription.started_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* Stage Change Action */}
          {onStageChange && (
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Mover para
              </h3>
              <Select value={lead.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar estágio" />
                </SelectTrigger>
                <SelectContent>
                  {CORE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', `bg-[hsl(var(--stage-${stage.replace('_', '-').replace('subscribed_', '')}))]`)}></span>
                        {STAGE_CONFIG[stage].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Queue Summary */}
          {leadQueueItems.length > 0 && (
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4 w-4" />
                Fila de Mensagens
              </h3>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {scheduledCount} agendada{scheduledCount !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  {sentCount} enviada{sentCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          )}

          <Separator />

          {/* Interaction History */}
          <div className="space-y-4">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline">Histórico</TabsTrigger>
                <TabsTrigger value="messages">Mensagens</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4 space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-16 bg-muted/50 rounded-md"></div>
                    <div className="h-16 bg-muted/50 rounded-md"></div>
                  </div>
                ) : timelineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum histórico disponível</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {timelineItems.map((item, index) => {
                      if (item.type === 'event') {
                        const event = item.data as Event;
                        const config = EVENT_LABELS[event.type] || { label: event.type, icon: <Bell className="h-4 w-4" /> };
                        return (
                          <div key={`event-${event.id}`} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 border border-border/50">
                            <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{config.label}</p>
                              {event.payload && Object.keys(event.payload).length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {JSON.stringify(event.payload)}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        const message = item.data as Message;
                        return (
                          <div 
                            key={`message-${message.id}`} 
                            className={cn(
                              "p-3 rounded-md border border-border/50",
                              message.direction === 'outbound' ? "bg-primary/5 ml-4" : "bg-muted/30 mr-4"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.direction === 'outbound' ? (
                                <ArrowRight className="h-3 w-3 text-primary" />
                              ) : (
                                <MessageCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {message.direction === 'outbound' ? 'Enviada' : 'Recebida'}
                              </span>
                              {message.is_ai_generated && (
                                <Badge variant="outline" className="text-xs py-0">IA</Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground line-clamp-3">{message.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="messages" className="mt-4 space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-20 bg-muted/50 rounded-md"></div>
                    <div className="h-20 bg-muted/50 rounded-md"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={cn(
                          "p-3 rounded-lg border",
                          message.direction === 'outbound' 
                            ? "bg-primary/10 border-primary/20 ml-6" 
                            : "bg-muted/50 border-border/50 mr-6"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {message.direction === 'outbound' ? (
                              <Send className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium">
                              {message.direction === 'outbound' ? 'Você' : lead.name}
                            </span>
                            {message.is_ai_generated && (
                              <Badge variant="secondary" className="text-xs py-0 px-1">IA</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {message.read_at && <CheckCircle className="h-3 w-3 text-blue-400" />}
                            {message.delivered_at && !message.read_at && <CheckCircle className="h-3 w-3" />}
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(message.sent_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Edit Lead Dialog */}
    <EditLeadDialog
      lead={lead}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={handleEditSuccess}
    />

    {/* Delete Lead Confirmation Dialog */}
    <DeleteLeadDialog
      lead={lead}
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      onSuccess={handleDeleteSuccess}
    />
  </>
  );
}
