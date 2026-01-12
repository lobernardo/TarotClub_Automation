import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { OnboardingTemplate, CreateOnboardingTemplateData, UpdateOnboardingTemplateData } from '@/hooks/useOnboardingTemplates';
import { FollowUpRule, ONBOARDING_FOLLOWUPS } from '@/constants/followUpRules';

interface OnboardingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: OnboardingTemplate | null;
  availableDelays: (currentTemplateId?: string) => FollowUpRule[];
  onSubmit: (data: CreateOnboardingTemplateData | UpdateOnboardingTemplateData, id?: string) => boolean;
}

export function OnboardingFormDialog({
  open,
  onOpenChange,
  template,
  availableDelays,
  onSubmit
}: OnboardingFormDialogProps) {
  const isEditing = !!template;

  const [delaySeconds, setDelaySeconds] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [active, setActive] = useState(true);

  // Get available delays for this template
  const delays = availableDelays(template?.id);
  const allDelays = ONBOARDING_FOLLOWUPS.subscribed_active;

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setDelaySeconds(template.delay_seconds);
        setContent(template.content);
        setActive(template.active);
      } else {
        setDelaySeconds(delays.length > 0 ? delays[0].delay_seconds : null);
        setContent('');
        setActive(true);
      }
    }
  }, [open, template, delays]);

  const handleSubmit = () => {
    if (isEditing) {
      const success = onSubmit({ content, active }, template.id);
      if (success) {
        onOpenChange(false);
      }
    } else {
      if (delaySeconds === null) return;
      const success = onSubmit({
        stage: 'subscribed_active',
        delay_seconds: delaySeconds,
        content,
        active
      });
      if (success) {
        onOpenChange(false);
      }
    }
  };

  const canSubmit = content.trim() && (isEditing || delaySeconds !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template de Onboarding' : 'Novo Template de Onboarding'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite o conteúdo e status do template. O tempo de envio não pode ser alterado.'
              : 'Crie um novo template de onboarding para novos assinantes.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Key (read-only for editing) */}
          {isEditing && template && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Chave do Template</Label>
              <div className="px-3 py-2 rounded-md bg-muted/50 border border-border">
                <code className="text-sm font-mono text-foreground">{template.template_key}</code>
              </div>
            </div>
          )}

          {/* Delay Selection */}
          <div className="space-y-2">
            <Label htmlFor="delay">Tempo de Envio *</Label>
            {isEditing ? (
              <div className="px-3 py-2 rounded-md bg-muted/50 border border-border">
                <span className="text-sm text-foreground">
                  {allDelays.find(d => d.delay_seconds === delaySeconds)?.label || 'N/A'}
                </span>
              </div>
            ) : (
              <Select
                value={delaySeconds?.toString() || ''}
                onValueChange={(value) => setDelaySeconds(parseInt(value))}
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  {delays.map((rule) => (
                    <SelectItem key={rule.delay_seconds} value={rule.delay_seconds.toString()}>
                      {rule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isEditing && delays.length === 0 && (
              <p className="text-xs text-amber-500">
                Todos os tempos de onboarding já possuem templates.
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Olá {nome}! 🎉\n\nBem-vinda ao Clube do Tarot!\n\nAqui está seu link exclusivo para o grupo VIP...`}
              className="min-h-[150px] bg-muted/50 border-border"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded">{'{nome}'}</code> para inserir o nome do cliente.
            </p>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="active" className="font-medium">Template Ativo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Templates inativos não são enviados
              </p>
            </div>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-primary text-primary-foreground"
          >
            {isEditing ? 'Salvar' : 'Criar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
