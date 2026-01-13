import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TemplateStage, CANONICAL_FOLLOWUPS, isValidFollowUp, generateTemplateKey } from '@/constants/followUpRules';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  template_key: string;
  name: string | null;
  description: string | null;
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

// Migration keys
const SALES_MIGRATION_KEY = 'message_templates_migrated_to_supabase';
const ONBOARDING_MIGRATION_KEY = 'onboarding_templates_migrated_to_supabase';
const OLD_SALES_STORAGE_KEY = 'message_templates';
const OLD_ONBOARDING_STORAGE_KEY = 'onboarding_templates';

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from Supabase
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('message_templates')
        .select('*')
        .order('stage', { ascending: true })
        .order('delay_seconds', { ascending: true });

      if (fetchError) {
        console.error('Error fetching templates:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Map to our interface
      const mappedTemplates: MessageTemplate[] = (data || []).map((row: any) => ({
        id: row.id,
        template_key: row.template_key,
        name: row.name,
        description: row.description,
        content: row.content,
        stage: row.stage as TemplateStage,
        delay_seconds: row.delay_seconds,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setTemplates(mappedTemplates);
      setError(null);
    } catch (err) {
      console.error('Error in fetchTemplates:', err);
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Migrate localStorage data to Supabase (runs once)
  const migrateFromLocalStorage = useCallback(async () => {
    // Check if already migrated
    const salesMigrated = localStorage.getItem(SALES_MIGRATION_KEY);
    const onboardingMigrated = localStorage.getItem(ONBOARDING_MIGRATION_KEY);

    // Migrate sales templates
    if (!salesMigrated) {
      try {
        const stored = localStorage.getItem(OLD_SALES_STORAGE_KEY);
        if (stored) {
          const oldTemplates = JSON.parse(stored);
          if (Array.isArray(oldTemplates) && oldTemplates.length > 0) {
            console.log(`Migrating ${oldTemplates.length} sales templates to Supabase...`);
            
            for (const t of oldTemplates) {
              // Check if already exists in Supabase
              const { data: existing } = await supabase
                .from('message_templates')
                .select('id')
                .eq('template_key', t.template_key)
                .maybeSingle();

              if (!existing) {
                await supabase.from('message_templates').insert({
                  template_key: t.template_key,
                  name: t.template_key,
                  content: t.content,
                  stage: t.stage,
                  delay_seconds: t.delay_seconds,
                  active: t.active
                });
              }
            }
            console.log('Sales templates migration complete');
          }
        }
        localStorage.setItem(SALES_MIGRATION_KEY, 'true');
        localStorage.removeItem(OLD_SALES_STORAGE_KEY);
      } catch (err) {
        console.error('Error migrating sales templates:', err);
      }
    }

    // Migrate onboarding templates
    if (!onboardingMigrated) {
      try {
        const stored = localStorage.getItem(OLD_ONBOARDING_STORAGE_KEY);
        if (stored) {
          const oldTemplates = JSON.parse(stored);
          if (Array.isArray(oldTemplates) && oldTemplates.length > 0) {
            console.log(`Migrating ${oldTemplates.length} onboarding templates to Supabase...`);
            
            for (const t of oldTemplates) {
              // Check if already exists in Supabase
              const { data: existing } = await supabase
                .from('message_templates')
                .select('id')
                .eq('template_key', t.template_key)
                .maybeSingle();

              if (!existing) {
                await supabase.from('message_templates').insert({
                  template_key: t.template_key,
                  name: t.template_key,
                  content: t.content,
                  stage: t.stage,
                  delay_seconds: t.delay_seconds,
                  active: t.active
                });
              }
            }
            console.log('Onboarding templates migration complete');
          }
        }
        localStorage.setItem(ONBOARDING_MIGRATION_KEY, 'true');
        localStorage.removeItem(OLD_ONBOARDING_STORAGE_KEY);
      } catch (err) {
        console.error('Error migrating onboarding templates:', err);
      }
    }
  }, []);

  // Initial load with migration
  useEffect(() => {
    const initialize = async () => {
      await migrateFromLocalStorage();
      await fetchTemplates();
    };
    initialize();
  }, [migrateFromLocalStorage, fetchTemplates]);

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
  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<boolean> => {
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

    try {
      const { error: insertError } = await supabase
        .from('message_templates')
        .insert({
          template_key,
          name: template_key,
          content: data.content.trim(),
          stage: data.stage,
          delay_seconds: data.delay_seconds,
          active: data.active
        });

      if (insertError) {
        console.error('Error creating template:', insertError);
        toast.error(`Erro ao criar template: ${insertError.message}`);
        return false;
      }

      await fetchTemplates();
      toast.success('Template criado com sucesso');
      return true;
    } catch (err) {
      console.error('Error in createTemplate:', err);
      toast.error('Erro ao criar template');
      return false;
    }
  }, [templates, combinationExists, fetchTemplates]);

  // Update an existing template (only content, active)
  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateData): Promise<boolean> => {
    // Validate content
    if (!data.content.trim()) {
      toast.error('O conteúdo da mensagem é obrigatório');
      return false;
    }

    const template = templates.find(t => t.id === id);
    if (!template) {
      toast.error('Template não encontrado');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('message_templates')
        .update({
          content: data.content.trim(),
          active: data.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating template:', updateError);
        toast.error(`Erro ao atualizar template: ${updateError.message}`);
        return false;
      }

      await fetchTemplates();
      toast.success('Template atualizado com sucesso');
      return true;
    } catch (err) {
      console.error('Error in updateTemplate:', err);
      toast.error('Erro ao atualizar template');
      return false;
    }
  }, [templates, fetchTemplates]);

  // Toggle active status
  const toggleActive = useCallback(async (id: string, active: boolean): Promise<boolean> => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      toast.error('Template não encontrado');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('message_templates')
        .update({
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error toggling template:', updateError);
        toast.error(`Erro ao alterar status: ${updateError.message}`);
        return false;
      }

      await fetchTemplates();
      toast.success(active ? 'Template ativado' : 'Template desativado');
      return true;
    } catch (err) {
      console.error('Error in toggleActive:', err);
      toast.error('Erro ao alterar status');
      return false;
    }
  }, [templates, fetchTemplates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    toggleActive,
    combinationExists,
    getAvailableDelays,
    refetch: fetchTemplates
  };
}
