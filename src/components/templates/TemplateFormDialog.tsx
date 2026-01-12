import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageTemplate, CreateTemplateData, UpdateTemplateData } from '@/hooks/useMessageTemplates';
import { ALLOWED_STAGES, STAGE_LABELS, CANONICAL_FOLLOWUPS, TemplateStage, FollowUpRule } from '@/constants/followUpRules';
import { AlertCircle } from 'lucide-react';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MessageTemplate | null;
  availableDelays: (stage: TemplateStage) => FollowUpRule[];
  onSubmit: (data: CreateTemplateData | UpdateTemplateData, id?: string) => boolean;
}

export function TemplateFormDialog({ 
  open, 
  onOpenChange, 
  template, 
  availableDelays,
  onSubmit 
}: TemplateFormDialogProps) {
  const isEditing = !!template;
  
  const [content, setContent] = useState('');
  const [stage, setStage] = useState<TemplateStage | ''>('');
  const [delaySeconds, setDelaySeconds] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setContent(template.content);
        setStage(template.stage);
        setDelaySeconds(template.delay_seconds);
        setActive(template.active);
      } else {
        setContent('');
        setStage('');
        setDelaySeconds('');
        setActive(true);
      }
    }
  }, [open, template]);

  // Get available delays for selected stage
  const delayOptions = stage ? (isEditing 
    ? CANONICAL_FOLLOWUPS[stage] // When editing, show all options (field is disabled anyway)
    : availableDelays(stage)
  ) : [];

  // Reset delay when stage changes (only for new templates)
  useEffect(() => {
    if (!isEditing && stage) {
      setDelaySeconds('');
    }
  }, [stage, isEditing]);

  const handleSubmit = () => {
    setSubmitting(true);

    let success: boolean;
    
    if (isEditing && template) {
      // Only update allowed fields (content, active)
      success = onSubmit({
        content: content.trim(),
        active
      }, template.id);
    } else {
      // Create new template
      if (!stage || delaySeconds === '' || !content.trim()) {
        setSubmitting(false);
        return;
      }
      success = onSubmit({
        content: content.trim(),
        stage,
        delay_seconds: delaySeconds as number,
        active
      });
    }

    setSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const isFormValid = isEditing 
    ? content.trim()
    : content.trim() && stage && delaySeconds !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Key (read-only, shown only when editing) */}
          {isEditing && template && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Template Key</Label>
              <div className="bg-muted px-3 py-2 rounded-md text-sm font-mono text-muted-foreground">
                {template.template_key}
              </div>
              <p className="text-xs text-muted-foreground">
                Identificador único (não editável)
              </p>
            </div>
          )}

          {/* Stage - disabled when editing */}
          <div className="space-y-2">
            <Label htmlFor="stage">Estágio do Lead *</Label>
            <Select 
              value={stage} 
              onValueChange={(value) => setStage(value as TemplateStage)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estágio" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                O estágio não pode ser alterado após a criação
              </p>
            )}
          </div>

          {/* Delay - disabled when editing */}
          <div className="space-y-2">
            <Label htmlFor="delay">Tempo de Follow-up *</Label>
            <Select 
              value={delaySeconds.toString()} 
              onValueChange={(value) => setDelaySeconds(parseInt(value))}
              disabled={isEditing || !stage}
            >
              <SelectTrigger>
                <SelectValue placeholder={stage ? "Selecione o tempo" : "Selecione o estágio primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {delayOptions.map((rule) => (
                  <SelectItem key={rule.delay_seconds} value={rule.delay_seconds.toString()}>
                    {rule.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                O tempo de follow-up não pode ser alterado após a criação
              </p>
            )}
            {!isEditing && stage && delayOptions.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>Todos os follow-ups deste estágio já possuem template</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Mensagem *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Olá {nome}, ..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Variável disponível: <code className="bg-muted px-1 rounded">{'{nome}'}</code>
            </p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Template Ativo</Label>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || submitting}
          >
            {submitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Template')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
