/**
 * Kanban Column para etapas derivadas do CRM
 * Exibe leads agrupados por etapa operacional (derivada de stage + eventos)
 */

import { useState } from "react";
import { Lead, LeadStage } from "@/types/database";
import { LeadCard } from "./LeadCard";
import { cn } from "@/lib/utils";
import { DerivedCRMStage, DERIVED_STAGE_CONFIG, LeadWithDerivedStage } from "@/hooks/useDerivedStages";

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
    e.dataTransfer.dropEffect = "move";
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
      checkout_started: "checkout_started",
      lead_captured: "lead_captured",
      conectado: "conectado",
      payment_pending: "payment_pending",
      onboarding: "subscribed_active",
      onboarding_sent: "subscribed_onboarding",
      cliente_ativo: "subscribed_active",
      subscribed_past_due: "subscribed_past_due",
      subscribed_canceled: "subscribed_canceled",
      nurture: "nurture",
      lost: "lost",
      blocked: "blocked",
    };
    return mapping[derivedStage];
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { leadId, fromStage } = data;

      const toStage = getBackendStageForDrop(derivedStage);

      if (fromStage !== toStage && onLeadDrop) {
        onLeadDrop(leadId, fromStage, toStage);
      }
    } catch (err) {
      console.error("Error parsing drag data:", err);
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
  };

  // Get stage accent color for header
  const getStageAccent = (stage: DerivedCRMStage): string => {
    const accents: Record<DerivedCRMStage, string> = {
      checkout_started: "bg-purple",
      lead_captured: "bg-info",
      conectado: "bg-info",
      payment_pending: "bg-warning",
      onboarding: "bg-accent",
      onboarding_sent: "bg-accent",
      cliente_ativo: "bg-success",
      subscribed_past_due: "bg-warning",
      subscribed_canceled: "bg-destructive",
      nurture: "bg-purple",
      lost: "bg-muted-foreground",
      blocked: "bg-muted-foreground",
    };
    return accents[stage] || "bg-accent";
  };

  return (
    <div
      className={cn(
        "kanban-column min-w-[300px] max-w-[340px] transition-all duration-200 relative",
        isDragOver && "ring-2 ring-accent/40 bg-accent/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header with accent bar */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-1 h-5 rounded-full", getStageAccent(derivedStage))} />
            <span className="font-semibold text-foreground text-sm">{config.label}</span>
          </div>
          <span className="count-badge">{leads.length}</span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
        {leads.length === 0 ? (
          <div
            className={cn(
              "text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl transition-all duration-200",
              isDragOver ? "border-accent/50 bg-accent/5" : "border-border",
            )}
          >
            {isDragOver ? (
              <span className="font-medium text-accent">Soltar aqui</span>
            ) : (
              <span>Nenhum lead</span>
            )}
          </div>
        ) : (
          leads.map((lead, index) => (
            <div 
              key={lead.id} 
              onDragStart={() => handleDragStart(lead.id)} 
              onDragEnd={handleDragEnd}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <LeadCard lead={lead} onClick={() => onLeadClick?.(lead)} isDragging={draggingLeadId === lead.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}