import { Edit2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/StageBadge';
import { MessageTemplate } from '@/hooks/useMessageTemplates';
import { getDelayLabel, AllowedFollowUpStage } from '@/constants/followUpRules';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: MessageTemplate;
  onEdit: (template: MessageTemplate) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function TemplateCard({ template, onEdit, onToggleActive }: TemplateCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all",
        template.active 
          ? "hover:border-primary/30" 
          : "opacity-60 border-dashed"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{template.name}</h3>
            {!template.active && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                Inativo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StageBadge stage={template.stage} />
            <span className="text-xs text-muted-foreground">
              {getDelayLabel(template.stage as AllowedFollowUpStage, template.delay_seconds)}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit(template)}
            title="Editar template"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-8 w-8",
              template.active 
                ? "text-destructive hover:text-destructive" 
                : "text-primary hover:text-primary"
            )}
            onClick={() => onToggleActive(template.id, !template.active)}
            title={template.active ? "Desativar template" : "Ativar template"}
          >
            {template.active ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans">
          {template.content}
        </pre>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Variáveis: {'{{nome}}'}</span>
      </div>
    </div>
  );
}
