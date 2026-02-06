/**
 * Kanban Column (fase 1)
 * Exibe leads agrupados por stage do banco (sem eventos).
 */

import { useState } from "react";
import { Lead, LeadStage, STAGE_CONFIG } from "@/types/database";
import { LeadCard } from "./LeadCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onLeadDrop?: (leadId: string, fromStage: LeadStage, toStage: LeadStage) => void;
}

const STAGE_ACCENTS: Record<LeadStage, string> = {
  captured_form: "bg-info",
  checkout_started: "bg-purple",
  payment_pending: "bg-warning",
  subscribed_active: "bg-success",
  conectado: "bg-info",
  lead_captured: "bg-info",
  agent_captured: "bg-info",
  subscribed_onboarding: "bg-accent",
  subscribed_past_due: "bg-warning",
  subscribed_canceled: "bg-destructive",
  nurture: "bg-purple",
  lost: "bg-muted-foreground",
  blocked: "bg-muted-foreground",
};

export function KanbanColumn({ stage, leads, onLeadClick, onLeadDrop }: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { leadId, fromStage } = data;
      if (fromStage !== stage && onLeadDrop) {
        onLeadDrop(leadId, fromStage, stage);
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
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-1 h-5 rounded-full", STAGE_ACCENTS[stage] || "bg-accent")} />
            <span className="font-semibold text-foreground text-sm">{config?.label || stage}</span>
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
            {isDragOver ? <span className="font-medium text-accent">Soltar aqui</span> : <span>Nenhum lead</span>}
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
