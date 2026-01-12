import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserCheck, Plus, Loader2, Clock, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboardingTemplates, OnboardingTemplate, CreateOnboardingTemplateData, UpdateOnboardingTemplateData } from '@/hooks/useOnboardingTemplates';
import { OnboardingTemplateCard } from '@/components/onboarding/OnboardingTemplateCard';
import { OnboardingFormDialog } from '@/components/onboarding/OnboardingFormDialog';

export default function Onboarding() {
  const { 
    templates, 
    loading, 
    createTemplate, 
    updateTemplate, 
    toggleActive,
    getAvailableDelays 
  } = useOnboardingTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: OnboardingTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleSubmit = (data: CreateOnboardingTemplateData | UpdateOnboardingTemplateData, id?: string): boolean => {
    if (id) {
      return updateTemplate(id, data as UpdateOnboardingTemplateData);
    }
    return createTemplate(data as CreateOnboardingTemplateData);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Clientes Ativos / Onboarding
            </h1>
            <p className="text-muted-foreground mt-1">
              Mensagens de boas-vindas e onboarding para novos assinantes
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

        {/* Important Notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Mensagens de onboarding não são follow-ups de venda.
            </p>
            <p className="text-sm text-muted-foreground">
              Este módulo é exclusivo para comunicação institucional com clientes ativos: 
              boas-vindas, link do grupo VIP e mensagens de orientação.
            </p>
          </div>
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
              Use <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{'{nome}'}</code> no conteúdo para inserir o nome do cliente automaticamente.
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
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum template de onboarding cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie templates de boas-vindas e orientações para novos assinantes
            </p>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>
        )}

        {/* Templates list */}
        {!loading && templates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Templates de Onboarding
              <span className="text-sm font-normal text-muted-foreground">
                ({templates.length} template{templates.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((template) => (
                <OnboardingTemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEditTemplate}
                  onToggleActive={toggleActive}
                />
              ))}
            </div>
          </div>
        )}

        {/* Form Dialog */}
        <OnboardingFormDialog
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
