/**
 * Edge Function: lead_from_form
 * 
 * Recebe payload do Forminator (WordPress) e cria/atualiza lead.
 * 
 * Endpoint: POST /functions/v1/lead_from_form
 * 
 * Payload esperado (Forminator):
 * {
 *   "name": "Nome do Lead",
 *   "email": "email@exemplo.com",
 *   "whatsapp": "11999998888",
 *   "form_id": "123" (opcional)
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormPayload {
  name: string;
  email: string;
  whatsapp: string;
  form_id?: string;
  source?: string;
  // Campos alternativos do Forminator
  nome?: string;
  telefone?: string;
  phone?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[lead_from_form] Request received");

    // Validar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse payload
    const payload: FormPayload = await req.json();
    console.log("[lead_from_form] Payload:", JSON.stringify(payload));

    // Normalizar campos (Forminator pode usar nomes diferentes)
    const name = payload.name || payload.nome || "Sem nome";
    const email = payload.email || "";
    const whatsapp = payload.whatsapp || payload.telefone || payload.phone || "";
    const source = payload.source || `forminator_${payload.form_id || "unknown"}`;

    // Validação básica
    if (!email && !whatsapp) {
      console.error("[lead_from_form] Missing email and whatsapp");
      return new Response(
        JSON.stringify({ error: "Email ou WhatsApp obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalizar whatsapp (remover caracteres não numéricos)
    const whatsappNorm = whatsapp.replace(/\D/g, "");

    // Buscar lead existente por email ou whatsapp
    let leadId: string | null = null;
    let isNewLead = false;

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, stage")
      .or(`email.eq.${email},whatsapp_norm.eq.${whatsappNorm}`)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      leadId = existingLead.id;
      console.log(`[lead_from_form] Lead existente encontrado: ${leadId}`);

      // Atualizar dados do lead existente
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name: name || undefined,
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          stage: "captured_form",
          source: source,
        })
        .eq("id", leadId);

      if (updateError) {
        console.error("[lead_from_form] Erro ao atualizar lead:", updateError);
        throw updateError;
      }
    } else {
      isNewLead = true;

      // Criar novo lead
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          name,
          email,
          whatsapp,
          stage: "captured_form",
          source,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[lead_from_form] Erro ao criar lead:", insertError);
        throw insertError;
      }

      leadId = newLead.id;
      console.log(`[lead_from_form] Novo lead criado: ${leadId}`);
    }

    // Registrar evento form_submitted
    const { error: eventError } = await supabase
      .from("events")
      .insert({
        lead_id: leadId,
        type: "form_submitted",
        metadata: {
          source,
          form_id: payload.form_id || null,
          is_new_lead: isNewLead,
        },
      });

    if (eventError) {
      console.error("[lead_from_form] Erro ao registrar evento:", eventError);
    }

    // Registrar integração se houver form_id
    if (payload.form_id) {
      await supabase
        .from("integrations")
        .upsert({
          lead_id: leadId,
          provider: "forminator",
          external_id: payload.form_id,
          entity_type: "form_submission",
          metadata: { submitted_at: new Date().toISOString() },
        }, {
          onConflict: "provider,external_id",
        });
    }

    console.log(`[lead_from_form] Lead processado com sucesso: ${leadId}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        is_new_lead: isNewLead,
        stage: "captured_form",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[lead_from_form] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
