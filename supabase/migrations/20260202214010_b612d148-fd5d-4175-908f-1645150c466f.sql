-- Habilitar RLS na tabela leads (estava faltando)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy permissiva para leads (CRM interno sem auth)
CREATE POLICY "Allow all operations on leads" ON public.leads
FOR ALL USING (true) WITH CHECK (true);