import { Lead } from '@/types/database';
import { MessageTemplate } from '@/hooks/useMessageTemplates';
import { OnboardingTemplate } from '@/hooks/useOnboardingTemplates';
import { getPredictedFollows, formatScheduledDateTime } from '@/lib/dispatcher';
import { Clock, CalendarClock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadPredictedFollowsProps {
  lead: Lead;
  templates: (MessageTemplate | OnboardingTemplate)[];
}

export function LeadPredictedFollows({ lead, templates }: LeadPredictedFollowsProps) {
  const predictedFollows = getPredictedFollows(lead, templates);

  if (predictedFollows.length === 0) {
    return (
      <div className="glass-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Follows Previstos
          </h3>
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
            Simulação
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Nenhum template ativo para o estágio atual
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Follows Previstos
        </h3>
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
          Simulação
        </Badge>
      </div>

      <div className="space-y-2">
        {predictedFollows.map((follow, index) => (
          <div 
            key={follow.template_key} 
            className="flex items-start justify-between p-3 rounded-md bg-muted/30 border border-border/50"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  #{index + 1}
                </span>
                <code className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {follow.template_key}
                </code>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{follow.delay_label}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-foreground">
                {formatScheduledDateTime(follow.scheduled_adjusted)}
              </div>
              {follow.is_adjusted && (
                <span className="text-xs text-amber-400">
                  ⏰ Ajustado (horário comercial)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-2 italic">
        ⚠️ Previsão baseada nos templates ativos. Horários ajustados para seg–sáb, 09h–20h.
      </p>
    </div>
  );
}
