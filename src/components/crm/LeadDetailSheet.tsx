/**
 * Lead Detail Sheet Component
 * Shows lead information for fase 1:
 * - Lead data (name, email, whatsapp, stage)
 * - Stage change action
 * - Edit and delete actions
 */

import { useState } from "react";
import { Lead, LeadStage, STAGE_CONFIG, CORE_STAGES } from "@/types/database";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StageBadge } from "@/components/ui/StageBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditLeadDialog } from "./EditLeadDialog";
import { DeleteLeadDialog } from "./DeleteLeadDialog";
import { Mail, MessageSquare, Calendar, Clock, User, ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageChange?: (leadId: string, newStage: LeadStage) => Promise<void>;
  onLeadUpdated?: () => void;
  onLeadDeleted?: () => void;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onStageChange,
  onLeadUpdated,
  onLeadDeleted,
}: LeadDetailSheetProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  if (!lead) return null;

  const createdAt = new Date(lead.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR });

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
    onOpenChange(false);
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)} title="Editar lead">
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
            <div className="glass-card rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Lead
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{lead.email || "Email não informado"}</span>
                </div>

                {lead.whatsapp && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.whatsapp}</span>
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
              </div>
            </div>

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
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              `bg-[hsl(var(--stage-${stage.replace("_", "-").replace("subscribed_", "")}))]`,
                            )}
                          ></span>
                          {STAGE_CONFIG[stage].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />
          </div>
        </SheetContent>
      </Sheet>

      <EditLeadDialog lead={lead} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={handleEditSuccess} />

      <DeleteLeadDialog
        lead={lead}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
