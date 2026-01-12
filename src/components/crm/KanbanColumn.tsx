import { Lead, LeadStage, STAGE_CONFIG } from '@/types/database';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanColumn({ stage, leads, onLeadClick }: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  
  return (
    <div className="kanban-column min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('stage-badge', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {leads.length}
          </span>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum lead neste estágio
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick?.(lead)}
            />
          ))
        )}
      </div>
    </div>
  );
}
