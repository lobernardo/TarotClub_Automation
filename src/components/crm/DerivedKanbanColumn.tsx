/**
 * Kanban Column para etapas derivadas do CRM
 * Exibe leads agrupados por etapa operacional (derivada de stage + eventos)
 */

import { useState } from 'react';
import { Lead, LeadStage } from '@/types/database';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';
import { DerivedCRMStage, DERIVED_STAGE_CONFIG, LeadWithDerivedStage } from '@/hooks/useDerivedStages';

interface DerivedKanbanColumnProps {
  derivedStage: DerivedCRMStage;
  leads: LeadWithDerivedStage[];
  onLeadClick?: (lead: Lead) => void;
  onLeadDrop?: (leadId: string, fromStage: LeadStage, toStage: LeadStage) => void;
}

export function DerivedKanbanColumn({ derivedStage, leads, onLeadClick, onLeadDrop }: DerivedKanbanColumnProps) {
  const config = DERIVED_STAGE_CONFIG[derivedStage];
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Mapeia etapas derivadas para stage do banco para drag-and-drop
  const getBackendStageForDrop = (derivedStage: DerivedCRMStage): LeadStage => {
    const mapping: Record<DerivedCRMStage, LeadStage> = {
      checkout_started: 'checkout_started',
      conectado: 'conectado',
      payment_pending: 'payment_pending',
      onboarding: 'subscribed_active',
      onboarding_sent: 'subscribed_onboarding',
      cliente_ativo: 'subscribed_active',
      subscribed_past_due: 'subscribed_past_due',
      subscribed_canceled: 'subscribed_canceled',
      nurture: 'nurture',
      lost: 'lost',
      blocked: 'blocked',
    };
    return mapping[derivedStage];
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { leadId, fromStage } = data;
      
      const toStage = getBackendStageForDrop(derivedStage);
      
      if (fromStage !== toStage && onLeadDrop) {
        onLeadDrop(leadId, fromStage, toStage);
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
