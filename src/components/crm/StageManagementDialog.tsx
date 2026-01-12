import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock } from 'lucide-react';
import { CORE_STAGES, STAGE_CONFIG, LeadStage } from '@/types/database';

interface StageManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageManagementDialog({ open, onOpenChange }: StageManagementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Gerenciar Etapas
          </DialogTitle>
          <DialogDescription>
            Etapas core do sistema. Estas etapas são definidas no PRD e não podem ser alteradas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Core stages - read only */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Etapas do Sistema (Obrigatórias)
            </h3>
            
            <div className="space-y-2">
              {CORE_STAGES.map((stage) => {
                const config = STAGE_CONFIG[stage];
                return (
                  <div
                    key={stage}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStageColorClass(stage)}`} />
                      <div>
                        <p className="font-medium text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Lock className="h-3 w-3" />
                        Sistema
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info message */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> As etapas core são imutáveis e definem o fluxo principal do funil de vendas e onboarding. 
              Etapas customizadas não estão disponíveis nesta versão.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStageColorClass(stage: LeadStage): string {
  const colorMap: Record<LeadStage, string> = {
    captured_form: 'bg-blue-500',
    checkout_started: 'bg-purple-500',
    payment_pending: 'bg-amber-500',
    subscribed_active: 'bg-emerald-500',
    subscribed_past_due: 'bg-orange-500',
    subscribed_canceled: 'bg-red-500',
    nurture: 'bg-violet-500',
    lost: 'bg-gray-500',
    blocked: 'bg-gray-700'
  };
  return colorMap[stage] || 'bg-gray-500';
}
