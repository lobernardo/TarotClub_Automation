import { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'onboarding_templates';

export function useOnboardingTemplates() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from localStorage
  useEffect(() => {
    const loadTemplates = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTemplates(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading onboarding templates:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: OnboardingTemplate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  }, []);

  // Create a new template
  const createTemplate = useCallback((data: CreateOnboardingTemplateData): boolean => {
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
    const now = new Date().toISOString();
    const newTemplate: OnboardingTemplate = {
      id: crypto.randomUUID(),
      template_key,
      stage: data.stage,
      delay_seconds: data.delay_seconds,
      content: data.content.trim(),
      active: data.active ?? true,
      created_at: now,
      updated_at: now
    };

    const newTemplates = [...templates, newTemplate].sort((a, b) => 
      a.delay_seconds - b.delay_seconds
    );

    saveTemplates(newTemplates);
    toast({
      title: 'Template de onboarding criado',
      description: `Template "${template_key}" criado com sucesso.`
    });
    return true;
  }, [templates, saveTemplates]);

  // Update an existing template (only content and active)
  const updateTemplate = useCallback((id: string, data: UpdateOnboardingTemplateData): boolean => {
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

    const updatedTemplate: OnboardingTemplate = {
      ...template,
      content: data.content !== undefined ? data.content.trim() : template.content,
      active: data.active !== undefined ? data.active : template.active,
      updated_at: new Date().toISOString()
    };

    const newTemplates = templates.map(t => t.id === id ? updatedTemplate : t);
    saveTemplates(newTemplates);
    toast({
      title: 'Template atualizado',
      description: 'As alterações foram salvas.'
    });
    return true;
  }, [templates, saveTemplates]);

  // Toggle active status
  const toggleActive = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const newTemplates = templates.map(t => 
      t.id === id 
        ? { ...t, active: !t.active, updated_at: new Date().toISOString() }
        : t
    );
    saveTemplates(newTemplates);
    toast({
      title: template.active ? 'Template desativado' : 'Template ativado',
      description: `O template foi ${template.active ? 'desativado' : 'ativado'}.`
    });
  }, [templates, saveTemplates]);

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
    getAvailableDelays
  };
}
