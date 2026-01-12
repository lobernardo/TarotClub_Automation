import { Lead } from '@/types/database';
import { StageBadge } from '@/components/ui/StageBadge';
import { Clock, MessageCircle, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <div className="lead-card animate-slide-up" onClick={onClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-foreground">{lead.name}</h4>
            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
              {lead.email}
            </p>
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
