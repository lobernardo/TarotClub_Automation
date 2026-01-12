import { useState, useCallback } from 'react';
import { TemplateStage, CANONICAL_FOLLOWUPS, isValidFollowUp, generateTemplateKey } from '@/constants/followUpRules';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  template_key: string; // immutable slug
  content: string;
  stage: TemplateStage;
  delay_seconds: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  content: string;
  stage: TemplateStage;
  delay_seconds: number;
  active: boolean;
}

export interface UpdateTemplateData {
  content: string;
  active: boolean;
}

// Local storage key for templates
const STORAGE_KEY = 'message_templates';

// Generate unique ID
function generateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load templates from localStorage
function loadTemplates(): MessageTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save templates to localStorage
function saveTemplates(templates: MessageTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => loadTemplates());
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Check if a stage+delay combination already exists
  const combinationExists = useCallback((stage: TemplateStage, delay_seconds: number, excludeId?: string) => {
    return templates.some(t => 
      t.stage === stage && 
      t.delay_seconds === delay_seconds && 
      t.id !== excludeId
    );
  }, [templates]);

  // Get available delay options for a stage (not yet used)
  const getAvailableDelays = useCallback((stage: TemplateStage) => {
    const allDelays = CANONICAL_FOLLOWUPS[stage] || [];
    return allDelays.filter(rule => 
      !templates.some(t => t.stage === stage && t.delay_seconds === rule.delay_seconds)
    );
  }, [templates]);

  // Create a new template
  const createTemplate = useCallback((data: CreateTemplateData): boolean => {
    // Validate content
    if (!data.content.trim()) {
      toast.error('O conteúdo da mensagem é obrigatório');
      return false;
    }

    // Validate the follow-up rule
    if (!isValidFollowUp(data.stage, data.delay_seconds)) {
      toast.error('Combinação de estágio e tempo inválida');
      return false;
    }

    // Check if combination already exists
    if (combinationExists(data.stage, data.delay_seconds)) {
      toast.error('Já existe um template para este estágio e tempo');
      return false;
    }

    const template_key = generateTemplateKey(data.stage, data.delay_seconds);
    
    // Double-check template_key uniqueness
    if (templates.some(t => t.template_key === template_key)) {
      toast.error('Template key já existe');
      return false;
    }

    const now = new Date().toISOString();
    const newTemplate: MessageTemplate = {
      id: generateId(),
      template_key,
      content: data.content.trim(),
      stage: data.stage,
      delay_seconds: data.delay_seconds,
      active: data.active,
      created_at: now,
      updated_at: now
    };

    const updatedTemplates = [...templates, newTemplate].sort((a, b) => {
      if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
      return a.delay_seconds - b.delay_seconds;
    });

    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    
    toast.success('Template criado com sucesso');
    return true;
  }, [templates, combinationExists]);

  // Update an existing template (only content, active)
  const updateTemplate = useCallback((id: string, data: UpdateTemplateData): boolean => {
    // Validate content
    if (!data.content.trim()) {
      toast.error('O conteúdo da mensagem é obrigatório');
      return false;
    }

    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      toast.error('Template não encontrado');
      return false;
    }

    const updatedTemplates = [...templates];
    updatedTemplates[templateIndex] = {
      ...updatedTemplates[templateIndex],
      content: data.content.trim(),
      active: data.active,
      updated_at: new Date().toISOString()
    };

    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    
    toast.success('Template atualizado com sucesso');
    return true;
  }, [templates]);

  // Toggle active status
  const toggleActive = useCallback((id: string, active: boolean): boolean => {
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      toast.error('Template não encontrado');
      return false;
    }

    const updatedTemplates = [...templates];
    updatedTemplates[templateIndex] = {
      ...updatedTemplates[templateIndex],
      active,
      updated_at: new Date().toISOString()
    };

    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    
    toast.success(active ? 'Template ativado' : 'Template desativado');
    return true;
  }, [templates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    toggleActive,
    combinationExists,
    getAvailableDelays
  };
}
