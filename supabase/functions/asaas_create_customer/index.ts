/**
 * Edge Function: asaas_create_customer
 * 
 * Cria cliente no Asaas e salva asaas_customer_id no lead.
 * 
 * Endpoint: POST /functions/v1/asaas_create_customer
 * 
 * Payload esperado:
 * {
 *   "lead_id": "uuid do lead",
 *   "cpfCnpj": "12345678900" (opcional, mas recomendado)
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerPayload {
  lead_id: string;
  cpfCnpj?: string;
}

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[asaas_create_customer] Request received");

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: CustomerPayload = await req.json();
    console.log("[asaas_create_customer] Payload:", JSON.stringify(payload));

    if (!payload.lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, email, whatsapp, whatsapp_norm, asaas_customer_id")
      .eq("id", payload.lead_id)
      .single();

    if (leadError || !lead) {
      console.error("[asaas_create_customer] Lead não encontrado:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se já tem cliente Asaas, retornar o existente
    if (lead.asaas_customer_id) {
      console.log(`[asaas_create_customer] Lead já tem cliente Asaas: ${lead.asaas_customer_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          asaas_customer_id: lead.asaas_customer_id,
          already_exists: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar dados para Asaas
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      console.error("[asaas_create_customer] ASAAS_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "ASAAS_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente no Asaas
    const asaasPayload = {
      name: lead.name,
      email: lead.email,
      phone: lead.whatsapp_norm || lead.whatsapp,
      cpfCnpj: payload.cpfCnpj || undefined,
      notificationDisabled: false,
    };

    console.log("[asaas_create_customer] Criando cliente no Asaas:", JSON.stringify(asaasPayload));

    const asaasResponse = await fetch("https://api.asaas.com/v3/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify(asaasPayload),
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error("[asaas_create_customer] Erro Asaas:", asaasData);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cliente no Asaas", details: asaasData }),
        { status: asaasResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const asaasCustomer: AsaasCustomer = asaasData;
    console.log(`[asaas_create_customer] Cliente Asaas criado: ${asaasCustomer.id}`);

    // Salvar asaas_customer_id no lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({ asaas_customer_id: asaasCustomer.id })
      .eq("id", lead.id);

    if (updateError) {
      console.error("[asaas_create_customer] Erro ao atualizar lead:", updateError);
    }

    // Registrar evento
    await supabase
      .from("events")
      .insert({
        lead_id: lead.id,
        type: "checkout_started",
        metadata: {
          asaas_customer_id: asaasCustomer.id,
          source: "asaas_create_customer",
        },
      });

    // Registrar integração
    await supabase
      .from("integrations")
      .upsert({
        lead_id: lead.id,
        provider: "asaas",
        external_id: asaasCustomer.id,
        entity_type: "customer",
        metadata: { created_at: new Date().toISOString() },
      }, {
        onConflict: "provider,external_id",
      });

    return new Response(
      JSON.stringify({
        success: true,
        asaas_customer_id: asaasCustomer.id,
        already_exists: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[asaas_create_customer] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
