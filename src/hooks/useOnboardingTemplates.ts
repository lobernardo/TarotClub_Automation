import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import {
  OnboardingStage,
  ONBOARDING_STAGES,
  ONBOARDING_FOLLOWUPS,
  isValidOnboardingFollowUp,
  generateTemplateKey,
  FollowUpRule
} from '@/constants/followUpRules';

export interface OnboardingTemplate {
  id: string;
  template_key: string;
  name: string | null;
  stage: OnboardingStage;
  delay_seconds: number;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOnboardingTemplateData {
  stage: OnboardingStage;
  delay_seconds: number;
  content: string;
  active?: boolean;
}

export interface UpdateOnboardingTemplateData {
  content?: string;
  active?: boolean;
}

export function useOnboardingTemplates() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch templates from Supabase (only onboarding stages)
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('message_templates')
        .select('*')
        .in('stage', ONBOARDING_STAGES)
        .order('delay_seconds', { ascending: true });

      if (fetchError) {
        console.error('Error fetching onboarding templates:', fetchError);
        return;
      }

      // Map to our interface
      const mappedTemplates: OnboardingTemplate[] = (data || []).map((row: any) => ({
        id: row.id,
        template_key: row.template_key,
        name: row.name,
        stage: row.stage as OnboardingStage,
        delay_seconds: row.delay_seconds,
        content: row.content,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Error loading onboarding templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Create a new template
  const createTemplate = useCallback(async (data: CreateOnboardingTemplateData): Promise<boolean> => {
    // Validation: stage must be an onboarding stage
    if (!ONBOARDING_STAGES.includes(data.stage)) {
      toast({
        title: 'Erro',
        description: 'Estágio inválido para templates de onboarding.',
        variant: 'destructive'
      });
      return false;
    }

    // Validation: delay must be valid for the stage
    if (!isValidOnboardingFollowUp(data.stage, data.delay_seconds)) {
      toast({
        title: 'Erro',
        description: 'O tempo de envio não é válido para onboarding.',
        variant: 'destructive'
      });
      return false;
    }

    // Validation: content is required
    if (!data.content?.trim()) {
      toast({
        title: 'Erro',
        description: 'O conteúdo do template é obrigatório.',
        variant: 'destructive'
      });
      return false;
    }

    // Validation: no duplicate stage + delay_seconds
    const exists = templates.some(
      t => t.stage === data.stage && t.delay_seconds === data.delay_seconds
    );
    if (exists) {
      toast({
        title: 'Erro',
        description: 'Já existe um template de onboarding para este tempo.',
        variant: 'destructive'
      });
      return false;
    }

    const template_key = generateTemplateKey(data.stage, data.delay_seconds);

    try {
      const { error: insertError } = await supabase
        .from('message_templates')
        .insert({
          template_key,
          name: template_key,
          content: data.content.trim(),
          stage: data.stage,
          delay_seconds: data.delay_seconds,
          active: data.active ?? true
        });

      if (insertError) {
        console.error('Error creating onboarding template:', insertError);
        toast({
          title: 'Erro',
          description: `Erro ao criar template: ${insertError.message}`,
          variant: 'destructive'
        });
        return false;
      }

      await fetchTemplates();
      toast({
        title: 'Template de onboarding criado',
        description: `Template "${template_key}" criado com sucesso.`
      });
      return true;
    } catch (err) {
      console.error('Error in createTemplate:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao criar template.',
        variant: 'destructive'
      });
      return false;
    }
  }, [templates, fetchTemplates]);

  // Update an existing template (only content and active)
  const updateTemplate = useCallback(async (id: string, data: UpdateOnboardingTemplateData): Promise<boolean> => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      toast({
        title: 'Erro',
        description: 'Template não encontrado.',
        variant: 'destructive'
      });
      return false;
    }

    // Validation: content is required if being updated
    if (data.content !== undefined && !data.content?.trim()) {
      toast({
        title: 'Erro',
        description: 'O conteúdo do template é obrigatório.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (data.content !== undefined) {
        updateData.content = data.content.trim();
      }
      if (data.active !== undefined) {
        updateData.active = data.active;
      }

      const { error: updateError } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating onboarding template:', updateError);
        toast({
          title: 'Erro',
          description: `Erro ao atualizar template: ${updateError.message}`,
          variant: 'destructive'
        });
        return false;
      }

      await fetchTemplates();
      toast({
        title: 'Template atualizado',
        description: 'As alterações foram salvas.'
      });
      return true;
    } catch (err) {
      console.error('Error in updateTemplate:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar template.',
        variant: 'destructive'
      });
      return false;
    }
  }, [templates, fetchTemplates]);

  // Toggle active status
  const toggleActive = useCallback(async (id: string): Promise<void> => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    try {
      const { error: updateError } = await supabase
        .from('message_templates')
        .update({
          active: !template.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error toggling onboarding template:', updateError);
        toast({
          title: 'Erro',
          description: `Erro ao alterar status: ${updateError.message}`,
          variant: 'destructive'
        });
        return;
      }

      await fetchTemplates();
      toast({
        title: template.active ? 'Template desativado' : 'Template ativado',
        description: `O template foi ${template.active ? 'desativado' : 'ativado'}.`
      });
    } catch (err) {
      console.error('Error in toggleActive:', err);
    }
  }, [templates, fetchTemplates]);

  // Get available delays (that don't have templates yet)
  const getAvailableDelays = useCallback((currentTemplateId?: string): FollowUpRule[] => {
    const stageRules = ONBOARDING_FOLLOWUPS.subscribed_active || [];
    return stageRules.filter(rule => {
      const existingTemplate = templates.find(
        t => t.delay_seconds === rule.delay_seconds
      );
      // Allow if no existing template OR if it's the current template being edited
      return !existingTemplate || existingTemplate.id === currentTemplateId;
    });
  }, [templates]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    toggleActive,
    getAvailableDelays,
    refetch: fetchTemplates
  };
}
