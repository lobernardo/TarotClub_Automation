import { useState } from 'react';
import { Lead, LeadStage, STAGE_CONFIG } from '@/types/database';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onLeadDrop?: (leadId: string, fromStage: LeadStage, toStage: LeadStage) => void;
}

export function KanbanColumn({ stage, leads, onLeadClick, onLeadDrop }: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { leadId, fromStage } = data;
      
      if (fromStage !== stage && onLeadDrop) {
        onLeadDrop(leadId, fromStage, stage);
      }
    } catch (err) {
      console.error('Error parsing drag data:', err);
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
  };
  
  return (
    <div 
      className={cn(
        "kanban-column min-w-[280px] max-w-[320px] transition-all duration-200",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      
      <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
        {leads.length === 0 ? (
          <div className={cn(
            "text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
            isDragOver ? "border-primary/50 bg-primary/5" : "border-transparent"
          )}>
            {isDragOver ? "Soltar aqui" : "Nenhum lead neste estágio"}
          </div>
        ) : (
          leads.map((lead) => (
            <div 
              key={lead.id}
              onDragStart={() => handleDragStart(lead.id)}
              onDragEnd={handleDragEnd}
            >
              <LeadCard
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
                isDragging={draggingLeadId === lead.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
