import { Lead } from "@/types/database";
import { Clock, MessageCircle, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ leadId: lead.id, fromStage: lead.stage }));
    e.dataTransfer.effectAllowed = "move";
  };

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "lead-card animate-scale-in cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 scale-95 rotate-1",
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="space-y-3">
        {/* Header with avatar */}
        <div className="flex items-start gap-3">
          <div className="avatar-premium h-10 w-10 text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{lead.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo}</span>
          </div>
          {lead.whatsapp && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="truncate max-w-[100px]">{lead.whatsapp}</span>
            </div>
          )}
        </div>

        {/* Last interaction */}
        {lead.last_interaction_at && (
          <div className="flex items-center gap-1.5 text-xs pt-2 border-t border-border/50">
            <MessageCircle className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">
              Última interação: {formatDistanceToNow(new Date(lead.last_interaction_at), { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Silenced indicator */}
        {lead.silenced_until && new Date(lead.silenced_until) > new Date() && (
          <div className="text-xs text-warning bg-warning/10 rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5 font-medium">
            <span>🔇</span>
            Silenciado
          </div>
        )}
      </div>
    </div>
  );
}