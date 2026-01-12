import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageTemplate, CreateTemplateData, UpdateTemplateData } from '@/hooks/useMessageTemplates';
import { ALLOWED_STAGES, STAGE_LABELS, CANONICAL_FOLLOWUPS, AllowedFollowUpStage, FollowUpRule } from '@/constants/followUpRules';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MessageTemplate | null;
  availableDelays: (stage: AllowedFollowUpStage) => FollowUpRule[];
  onSubmit: (data: CreateTemplateData | UpdateTemplateData, id?: string) => Promise<boolean>;
}

export function TemplateFormDialog({ 
  open, 
  onOpenChange, 
  template, 
  availableDelays,
  onSubmit 
}: TemplateFormDialogProps) {
  const isEditing = !!template;
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [stage, setStage] = useState<AllowedFollowUpStage | ''>('');
  const [delaySeconds, setDelaySeconds] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setContent(template.content);
        setStage(template.stage);
        setDelaySeconds(template.delay_seconds);
        setActive(template.active);
      } else {
        setName('');
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

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      return;
    }

    setSubmitting(true);

    let success: boolean;
    
    if (isEditing && template) {
      // Only update allowed fields
      success = await onSubmit({
        name: name.trim(),
        content: content.trim(),
        active
      }, template.id);
    } else {
      // Create new template
      if (!stage || delaySeconds === '') {
        setSubmitting(false);
        return;
      }
      success = await onSubmit({
        name: name.trim(),
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
    ? name.trim() && content.trim()
    : name.trim() && content.trim() && stage && delaySeconds !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas D+2"
            />
          </div>

          {/* Stage - disabled when editing */}
          <div className="space-y-2">
            <Label htmlFor="stage">Estágio do Lead</Label>
            <Select 
              value={stage} 
              onValueChange={(value) => setStage(value as AllowedFollowUpStage)}
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
            <Label htmlFor="delay">Tempo de Follow-up</Label>
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
              <p className="text-xs text-destructive">
                Todos os follow-ups deste estágio já possuem template
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Mensagem</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Use {{nome}} para inserir o nome do lead"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{{nome}}'}
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
