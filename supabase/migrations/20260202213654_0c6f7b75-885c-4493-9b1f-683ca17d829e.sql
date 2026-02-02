-- ===========================================
-- BACKEND COMPLETO: Automação de Vendas Tarot Club
-- ===========================================

-- 1. ADICIONAR COLUNAS ASAAS NA TABELA LEADS
-- ===========================================
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_norm TEXT,
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS silenced_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_stage TEXT;

-- Índices para busca rápida por IDs externos
CREATE INDEX IF NOT EXISTS idx_leads_asaas_customer_id ON public.leads(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_asaas_subscription_id ON public.leads(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_norm ON public.leads(whatsapp_norm);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);

-- 2. TABELA EVENTS (Histórico de eventos do lead)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON public.events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- RLS para events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on events" ON public.events
FOR ALL USING (true) WITH CHECK (true);

-- 3. TABELA MESSAGES (Histórico de mensagens)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  template_id UUID,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at);

-- RLS para messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on messages" ON public.messages
FOR ALL USING (true) WITH CHECK (true);

-- 4. TABELA MESSAGE_QUEUE (Fila de mensagens agendadas)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  stage TEXT,
  delay_seconds INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'canceled', 'failed')),
  sent_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_lead_template UNIQUE (lead_id, template_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_queue_lead_id ON public.message_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled_for ON public.message_queue(scheduled_for);

-- RLS para message_queue
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on message_queue" ON public.message_queue
FOR ALL USING (true) WITH CHECK (true);

-- 5. TABELA INTEGRATIONS (Vínculos com IDs externos)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_provider_external_id UNIQUE (provider, external_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integrations_lead_id ON public.integrations(lead_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_external_id ON public.integrations(external_id);

-- RLS para integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on integrations" ON public.integrations
FOR ALL USING (true) WITH CHECK (true);

-- 6. TABELA APPOINTMENTS (Agendamentos)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'canceled')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  google_calendar_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON public.appointments(starts_at);

-- RLS para appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on appointments" ON public.appointments
FOR ALL USING (true) WITH CHECK (true);

-- 7. TABELA SUBSCRIPTIONS (Assinaturas)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  asaas_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'past_due', 'canceled', 'pending')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_lead_id ON public.subscriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON public.subscriptions(asaas_subscription_id);

-- RLS para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on subscriptions" ON public.subscriptions
FOR ALL USING (true) WITH CHECK (true);

-- 8. TABELA MESSAGE_TEMPLATES (Templates de mensagens)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  stage TEXT,
  delay_seconds INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on message_templates" ON public.message_templates
FOR ALL USING (true) WITH CHECK (true);

-- 9. TABELA SYSTEM_SETTINGS (Configurações globais)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on system_settings" ON public.system_settings
FOR ALL USING (true) WITH CHECK (true);

-- 10. FUNÇÃO PARA NORMALIZAR WHATSAPP
-- ===========================================
CREATE OR REPLACE FUNCTION public.normalize_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.whatsapp IS NOT NULL THEN
    NEW.whatsapp_norm := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para normalizar whatsapp automaticamente
DROP TRIGGER IF EXISTS trigger_normalize_whatsapp ON public.leads;
CREATE TRIGGER trigger_normalize_whatsapp
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_whatsapp();

-- 11. FUNÇÃO PARA ATUALIZAR updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at em todas as tabelas
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_queue_updated_at ON public.message_queue;
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. FUNÇÃO PARA BUSCAR LEAD POR EMAIL OU WHATSAPP
-- ===========================================
CREATE OR REPLACE FUNCTION public.find_or_create_lead(
  p_name TEXT,
  p_email TEXT,
  p_whatsapp TEXT,
  p_stage TEXT DEFAULT 'captured_form',
  p_source TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
  v_whatsapp_norm TEXT;
BEGIN
  -- Normalizar whatsapp
  v_whatsapp_norm := regexp_replace(COALESCE(p_whatsapp, ''), '[^0-9]', '', 'g');
  
  -- Buscar lead existente por email ou whatsapp_norm
  SELECT id INTO v_lead_id
  FROM public.leads
  WHERE email = p_email 
     OR (whatsapp_norm = v_whatsapp_norm AND v_whatsapp_norm != '')
  LIMIT 1;
  
  IF v_lead_id IS NOT NULL THEN
    -- Atualizar lead existente
    UPDATE public.leads
    SET 
      name = COALESCE(NULLIF(p_name, ''), name),
      email = COALESCE(NULLIF(p_email, ''), email),
      whatsapp = COALESCE(NULLIF(p_whatsapp, ''), whatsapp),
      stage = p_stage::lead_stage,
      source = COALESCE(p_source, source),
      updated_at = now()
    WHERE id = v_lead_id;
    
    RETURN v_lead_id;
  ELSE
    -- Criar novo lead
    INSERT INTO public.leads (name, email, whatsapp, stage, source)
    VALUES (p_name, p_email, p_whatsapp, p_stage::lead_stage, p_source)
    RETURNING id INTO v_lead_id;
    
    RETURN v_lead_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. FUNÇÃO PARA REGISTRAR EVENTO
-- ===========================================
CREATE OR REPLACE FUNCTION public.log_event(
  p_lead_id UUID,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.events (lead_id, type, metadata)
  VALUES (p_lead_id, p_type, p_metadata)
  RETURNING id INTO v_event_id;
  
  -- Atualizar last_interaction_at do lead
  UPDATE public.leads
  SET last_interaction_at = now()
  WHERE id = p_lead_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. FUNÇÃO PARA ATUALIZAR STAGE COM EVENTO
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_lead_stage(
  p_lead_id UUID,
  p_new_stage TEXT,
  p_reason TEXT DEFAULT 'manual'
)
RETURNS VOID AS $$
DECLARE
  v_old_stage TEXT;
BEGIN
  -- Buscar stage atual
  SELECT stage INTO v_old_stage
  FROM public.leads
  WHERE id = p_lead_id;
  
  IF v_old_stage IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado: %', p_lead_id;
  END IF;
  
  -- Atualizar stage
  UPDATE public.leads
  SET 
    previous_stage = v_old_stage,
    stage = p_new_stage::lead_stage,
    updated_at = now()
  WHERE id = p_lead_id;
  
  -- Registrar evento de mudança de stage
  INSERT INTO public.events (lead_id, type, metadata)
  VALUES (
    p_lead_id, 
    'stage_changed',
    jsonb_build_object(
      'old_stage', v_old_stage,
      'new_stage', p_new_stage,
      'reason', p_reason
    )
  );
  
  -- Cancelar mensagens pendentes do stage antigo
  PERFORM public.cancel_messages_outside_stage(p_lead_id, p_new_stage::lead_stage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar whatsapp_norm para leads existentes
UPDATE public.leads
SET whatsapp_norm = regexp_replace(whatsapp, '[^0-9]', '', 'g')
WHERE whatsapp IS NOT NULL AND (whatsapp_norm IS NULL OR whatsapp_norm = '');