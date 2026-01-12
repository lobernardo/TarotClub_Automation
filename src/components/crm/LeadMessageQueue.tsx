/**
 * Lead Message Queue Component
 * 
 * Displays the message queue for a specific lead.
 * Read-only - no send buttons, no actions.
 */

import { Lead } from '@/types/database';
import { QueuedMessage, QueueStatus } from '@/types/messageQueue';
import { getDelayLabel, TemplateStage } from '@/constants/followUpRules';
import { formatScheduledDateTime } from '@/lib/dispatcher';
import { Clock, CalendarClock, Ban, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeadMessageQueueProps {
  lead: Lead;
  queueItems: QueuedMessage[];
  loading?: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<QueueStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  scheduled: {
    label: 'Agendado',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  canceled: {
    label: 'Cancelado',
    icon: Ban,
    className: 'bg-destructive/10 text-destructive border-destructive/30'
  },
  sent: {
    label: 'Enviado',
    icon: CheckCircle,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  }
};

export function LeadMessageQueue({ lead, queueItems, loading }: LeadMessageQueueProps) {
  // Filter items for this lead
  const leadQueueItems = queueItems
    .filter(item => item.lead_id === lead.id)
    .sort((a, b) => {
      // Sort: scheduled first, then by date
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
    });

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Send className="h-4 w-4" />
            Fila de Mensagens
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-muted/50 rounded-md"></div>
          <div className="h-16 bg-muted/50 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (leadQueueItems.length === 0) {
    return (
      <div className="glass-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Send className="h-4 w-4" />
            Fila de Mensagens
          </h3>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Nenhuma mensagem na fila para este lead
        </p>
      </div>
    );
  }

  const scheduledCount = leadQueueItems.filter(i => i.status === 'scheduled').length;
  const canceledCount = leadQueueItems.filter(i => i.status === 'canceled').length;

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Send className="h-4 w-4" />
          Fila de Mensagens
        </h3>
        <div className="flex gap-2">
          {scheduledCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
              {scheduledCount} agendado{scheduledCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {canceledCount > 0 && (
            <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
              {canceledCount} cancelado{canceledCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {leadQueueItems.map((item, index) => {
          const statusConfig = STATUS_CONFIG[item.status];
          const StatusIcon = statusConfig.icon;
          const scheduledDate = new Date(item.scheduled_for);
          const isPast = item.status === 'scheduled' && scheduledDate < new Date();

          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-start justify-between p-3 rounded-md border border-border/50",
                item.status === 'scheduled' ? "bg-muted/30" : "bg-muted/10 opacity-70"
              )}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                  <code className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {item.template_key}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  <span>
                    {getDelayLabel(item.stage as TemplateStage, item.delay_seconds)}
                  </span>
                </div>
                <div className="text-sm text-foreground">
                  {formatScheduledDateTime(scheduledDate)}
                </div>
                {item.cancel_reason && (
                  <p className="text-xs text-muted-foreground italic">
                    Motivo: {item.cancel_reason === 'stage_changed' ? 'Estágio alterado' : item.cancel_reason}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  variant="outline" 
                  className={cn("flex items-center gap-1 text-xs", statusConfig.className)}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {isPast && item.status === 'scheduled' && (
                  <span className="text-xs text-amber-400">
                    ⏰ Atrasado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-2 italic">
        ⚠️ Somente leitura. O dispatcher processará a fila automaticamente.
      </p>
    </div>
  );
}
