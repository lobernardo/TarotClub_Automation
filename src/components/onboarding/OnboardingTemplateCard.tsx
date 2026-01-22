import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Clock, Key, Users } from "lucide-react";
import { OnboardingTemplate } from "@/hooks/useOnboardingTemplates";
import { getDelayLabel, ONBOARDING_STAGE_LABELS } from "@/constants/followUpRules";
import { cn } from "@/lib/utils";

interface OnboardingTemplateCardProps {
  template: OnboardingTemplate;
  onEdit: (template: OnboardingTemplate) => void;
  onToggleActive: (id: string) => Promise<void> | void;
  eligibleCount?: number; // Count of eligible leads (from Supabase)
}

export function OnboardingTemplateCard({
  template,
  onEdit,
  onToggleActive,
  eligibleCount = 0,
}: OnboardingTemplateCardProps) {
  const delayLabel = getDelayLabel(template.stage, template.delay_seconds);
  const stageLabel = ONBOARDING_STAGE_LABELS[template.stage];

  return (
    <Card className="glass-card border-border hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {stageLabel}
              </Badge>

              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {delayLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Key className="h-3 w-3" />
              <code className="font-mono">{template.template_key}</code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={template.active}
              onCheckedChange={() => onToggleActive(template.id)}
              className="data-[state=checked]:bg-primary"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(template)}
              className="h-8 w-8"
              title="Editar template"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{template.content}</p>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              template.active ? "text-emerald-400" : "text-muted-foreground",
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", template.active ? "bg-emerald-400" : "bg-muted-foreground")} />
            {template.active ? "Ativo" : "Inativo"}
          </span>

          <div className="flex items-center gap-2">
            {/* Eligible leads badge */}
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1.5 text-xs",
                eligibleCount > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border",
              )}
            >
              <Users className="h-3 w-3" />
              {eligibleCount} lead
              {eligibleCount !== 1 ? "s" : ""} elegível
              {eligibleCount !== 1 ? "eis" : ""}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
