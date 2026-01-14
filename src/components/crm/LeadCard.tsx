import { Lead } from '@/types/database';
import { StageBadge } from '@/components/ui/StageBadge';
import { Clock, MessageCircle, Phone, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ leadId: lead.id, fromStage: lead.stage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={cn(
        "lead-card animate-slide-up cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 scale-95"
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground">{lead.name}</h4>
              <p className="text-sm text-muted-foreground truncate max-w-[160px]">
                {lead.email}
              </p>
            </div>
          </div>
          <StageBadge stage={lead.stage} />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {lead.last_interaction_at && (
          <div className="flex items-center gap-1.5 text-xs">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Última interação: {formatDistanceToNow(new Date(lead.last_interaction_at), { locale: ptBR })}
            </span>
          </div>
        )}

        {lead.silenced_until && new Date(lead.silenced_until) > new Date() && (
          <div className="text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-1 inline-block">
            🔇 Silenciado
          </div>
        )}
      </div>
    </div>
  );
}
