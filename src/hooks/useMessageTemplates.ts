import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AllowedFollowUpStage, CANONICAL_FOLLOWUPS, isValidFollowUp } from '@/constants/followUpRules';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  stage: AllowedFollowUpStage;
  delay_seconds: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  content: string;
  stage: AllowedFollowUpStage;
  delay_seconds: number;
  active: boolean;
}

export interface UpdateTemplateData {
  name: string;
  content: string;
  active: boolean;
}

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
      .from('message_templates')
      .select('*')
      .order('stage', { ascending: true })
      .order('delay_seconds', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      toast.error('Erro ao carregar templates');
    } else {
      setTemplates(data || []);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Check if a stage+delay combination already exists
  const combinationExists = useCallback((stage: AllowedFollowUpStage, delay_seconds: number, excludeId?: string) => {
    return templates.some(t => 
      t.stage === stage && 
      t.delay_seconds === delay_seconds && 
      t.id !== excludeId
    );
  }, [templates]);

  // Get available delay options for a stage (not yet used)
  const getAvailableDelays = useCallback((stage: AllowedFollowUpStage) => {
    const allDelays = CANONICAL_FOLLOWUPS[stage] || [];
    return allDelays.filter(rule => 
      !templates.some(t => t.stage === stage && t.delay_seconds === rule.delay_seconds)
    );
  }, [templates]);

  // Create a new template
  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<boolean> => {
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

    const { error: insertError } = await supabase
      .from('message_templates')
      .insert({
        name: data.name,
        content: data.content,
        stage: data.stage,
        delay_seconds: data.delay_seconds,
        active: data.active
      });

    if (insertError) {
      toast.error('Erro ao criar template: ' + insertError.message);
      return false;
    }

    toast.success('Template criado com sucesso');
    await fetchTemplates();
    return true;
  }, [combinationExists, fetchTemplates]);

  // Update an existing template (only name, content, active)
  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateData): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('message_templates')
      .update({
        name: data.name,
        content: data.content,
        active: data.active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      toast.error('Erro ao atualizar template: ' + updateError.message);
      return false;
    }

    toast.success('Template atualizado com sucesso');
    await fetchTemplates();
    return true;
  }, [fetchTemplates]);

  // Toggle active status
  const toggleActive = useCallback(async (id: string, active: boolean): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('message_templates')
      .update({ 
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      toast.error('Erro ao atualizar status');
      return false;
    }

    toast.success(active ? 'Template ativado' : 'Template desativado');
    await fetchTemplates();
    return true;
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    toggleActive,
    combinationExists,
    getAvailableDelays
  };
}
