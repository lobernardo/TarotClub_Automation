import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileText, Plus, Loader2, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessageTemplates, MessageTemplate, CreateTemplateData, UpdateTemplateData } from '@/hooks/useMessageTemplates';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateFormDialog } from '@/components/templates/TemplateFormDialog';
import { SALES_STAGE_LABELS, SalesFollowUpStage, SALES_STAGES } from '@/constants/followUpRules';

export default function Templates() {
  const { 
    templates, 
    loading, 
    createTemplate, 
    updateTemplate, 
    toggleActive,
    getAvailableDelays 
  } = useMessageTemplates();

  // Load message queue for scheduled counts
  const { countScheduledForTemplate } = useMessageQueue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateTemplateData | UpdateTemplateData, id?: string): Promise<boolean> => {
    if (id) {
      return await updateTemplate(id, data as UpdateTemplateData);
    }
    return await createTemplate(data as CreateTemplateData);
  };

  // Group templates by stage
  const templatesByStage = templates.reduce((acc, template) => {
    const stage = template.stage as SalesFollowUpStage;
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(template);
    return acc;
  }, {} as Record<SalesFollowUpStage, MessageTemplate[]>);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Templates de Follow-up (Venda)
            </h1>
            <p className="text-muted-foreground mt-1">
              Modelos de mensagens para follow-ups de leads captados e checkout
            </p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleNewTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Business Hours Info Banner */}
        <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
          <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              ⏰ Janela de Envio
            </p>
            <p className="text-sm text-muted-foreground">
              Os follow-ups são enviados apenas de <strong>segunda a sábado</strong>, entre <strong>09h e 20h</strong>.
              <br />
              Mensagens fora desse horário são automaticamente ajustadas para o próximo horário válido.
            </p>
          </div>
        </div>

        {/* Variable Info */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Variável Disponível
            </p>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{'{nome}'}</code> no conteúdo para inserir o nome do lead automaticamente.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum template de venda cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie templates para follow-ups de leads captados e checkout abandonado
            </p>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>
        )}

        {/* Templates grouped by stage */}
        {!loading && templates.length > 0 && (
          <div className="space-y-8">
            {SALES_STAGES.filter(stage => templatesByStage[stage]?.length > 0).map((stage) => (
              <div key={stage}>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  {SALES_STAGE_LABELS[stage]}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({templatesByStage[stage].length} template{templatesByStage[stage].length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {templatesByStage[stage].map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleEditTemplate}
                      onToggleActive={toggleActive}
                      scheduledCount={countScheduledForTemplate(template.template_key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <TemplateFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          template={editingTemplate}
          availableDelays={getAvailableDelays}
          onSubmit={handleSubmit}
        />
      </div>
    </AppLayout>
  );
}
