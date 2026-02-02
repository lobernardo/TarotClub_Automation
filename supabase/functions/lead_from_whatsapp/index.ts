/**
 * Edge Function: lead_from_whatsapp
 * 
 * Recebe payload de mensagem WhatsApp (via middleware/Z-API) e cria lead + evento + mensagem.
 * 
 * Endpoint: POST /functions/v1/lead_from_whatsapp
 * 
 * Payload esperado:
 * {
 *   "phone": "5511999998888",
 *   "name": "Nome do contato" (opcional),
 *   "message": "Texto da mensagem",
 *   "message_id": "ID externo da mensagem" (opcional),
 *   "timestamp": "2024-01-15T10:30:00Z" (opcional)
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppPayload {
  phone: string;
  name?: string;
  message: string;
  message_id?: string;
  timestamp?: string;
  // Campos alternativos do Z-API
  from?: string;
  text?: string;
  body?: string;
  pushName?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[lead_from_whatsapp] Request received");

    // Validar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse payload
    const payload: WhatsAppPayload = await req.json();
    console.log("[lead_from_whatsapp] Payload:", JSON.stringify(payload));

    // Normalizar campos (diferentes fontes podem usar nomes diferentes)
    const phone = payload.phone || payload.from || "";
    const name = payload.name || payload.pushName || "WhatsApp Lead";
    const message = payload.message || payload.text || payload.body || "";
    const messageId = payload.message_id;
    const timestamp = payload.timestamp || new Date().toISOString();

    // Validação básica
    if (!phone) {
      console.error("[lead_from_whatsapp] Missing phone number");
      return new Response(
        JSON.stringify({ error: "Número de telefone obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalizar whatsapp (remover caracteres não numéricos)
    const whatsappNorm = phone.replace(/\D/g, "");

    // Buscar lead existente por whatsapp
    let leadId: string | null = null;
    let isNewLead = false;
    let currentStage: string | null = null;

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, stage, name")
      .eq("whatsapp_norm", whatsappNorm)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      leadId = existingLead.id;
      currentStage = existingLead.stage;
      console.log(`[lead_from_whatsapp] Lead existente encontrado: ${leadId}, stage: ${currentStage}`);

      // Atualizar last_interaction_at e nome se estava vazio
      const updates: Record<string, unknown> = {
        last_interaction_at: new Date().toISOString(),
      };

      // Atualizar nome apenas se o lead não tinha nome ou era genérico
      if (!existingLead.name || existingLead.name === "WhatsApp Lead" || existingLead.name === "Sem nome") {
        updates.name = name;
      }

      await supabase
        .from("leads")
        .update(updates)
        .eq("id", leadId);

    } else {
      isNewLead = true;

      // Criar novo lead com stage 'conectado'
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          name,
          email: `${whatsappNorm}@whatsapp.placeholder`,
          whatsapp: phone,
          stage: "conectado",
          source: "whatsapp_inbound",
        })
        .select("id, stage")
        .single();

      if (insertError) {
        console.error("[lead_from_whatsapp] Erro ao criar lead:", insertError);
        throw insertError;
      }

      leadId = newLead.id;
      currentStage = newLead.stage;
      console.log(`[lead_from_whatsapp] Novo lead criado: ${leadId}`);
    }

    // Registrar evento message_received
    const { error: eventError } = await supabase
      .from("events")
      .insert({
        lead_id: leadId,
        type: "message_received",
        metadata: {
          is_new_lead: isNewLead,
          message_preview: message.substring(0, 100),
          source: "whatsapp_inbound",
        },
      });

    if (eventError) {
      console.error("[lead_from_whatsapp] Erro ao registrar evento:", eventError);
    }

    // Registrar mensagem inbound
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        lead_id: leadId,
        direction: "inbound",
        content: message,
        sent_at: timestamp,
        external_id: messageId || null,
        is_ai_generated: false,
        metadata: {
          source: "whatsapp",
          phone: whatsappNorm,
        },
      });

    if (messageError) {
      console.error("[lead_from_whatsapp] Erro ao registrar mensagem:", messageError);
    }

    console.log(`[lead_from_whatsapp] Lead processado com sucesso: ${leadId}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        is_new_lead: isNewLead,
        stage: currentStage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[lead_from_whatsapp] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
