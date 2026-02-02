/**
 * Edge Function: asaas_create_subscription
 * 
 * Cria assinatura/cobrança no Asaas e salva asaas_subscription_id no lead.
 * 
 * Endpoint: POST /functions/v1/asaas_create_subscription
 * 
 * Payload esperado:
 * {
 *   "lead_id": "uuid do lead",
 *   "value": 97.00,
 *   "cycle": "MONTHLY" (opcional, padrão MONTHLY),
 *   "description": "Clube do Tarot - Assinatura Mensal" (opcional)
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionPayload {
  lead_id: string;
  value: number;
  cycle?: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  description?: string;
  billing_type?: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
}

interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[asaas_create_subscription] Request received");

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: SubscriptionPayload = await req.json();
    console.log("[asaas_create_subscription] Payload:", JSON.stringify(payload));

    if (!payload.lead_id || !payload.value) {
      return new Response(
        JSON.stringify({ error: "lead_id e value obrigatórios" }),
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
      .select("id, name, email, asaas_customer_id, asaas_subscription_id")
      .eq("id", payload.lead_id)
      .single();

    if (leadError || !lead) {
      console.error("[asaas_create_subscription] Lead não encontrado:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se tem cliente Asaas
    if (!lead.asaas_customer_id) {
      console.error("[asaas_create_subscription] Lead sem asaas_customer_id");
      return new Response(
        JSON.stringify({ error: "Lead não tem cliente Asaas. Crie o cliente primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se já tem assinatura, retornar a existente
    if (lead.asaas_subscription_id) {
      console.log(`[asaas_create_subscription] Lead já tem assinatura: ${lead.asaas_subscription_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          asaas_subscription_id: lead.asaas_subscription_id,
          already_exists: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar dados para Asaas
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      console.error("[asaas_create_subscription] ASAAS_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "ASAAS_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular próxima data de vencimento (amanhã)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

    // Criar assinatura no Asaas
    const asaasPayload = {
      customer: lead.asaas_customer_id,
      billingType: payload.billing_type || "UNDEFINED",
      value: payload.value,
      nextDueDate: nextDueDateStr,
      cycle: payload.cycle || "MONTHLY",
      description: payload.description || "Clube do Tarot - Assinatura Mensal",
    };

    console.log("[asaas_create_subscription] Criando assinatura no Asaas:", JSON.stringify(asaasPayload));

    const asaasResponse = await fetch("https://api.asaas.com/v3/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify(asaasPayload),
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error("[asaas_create_subscription] Erro Asaas:", asaasData);
      return new Response(
        JSON.stringify({ error: "Erro ao criar assinatura no Asaas", details: asaasData }),
        { status: asaasResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const asaasSubscription: AsaasSubscription = asaasData;
    console.log(`[asaas_create_subscription] Assinatura Asaas criada: ${asaasSubscription.id}`);

    // Salvar asaas_subscription_id no lead e atualizar stage
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        asaas_subscription_id: asaasSubscription.id,
        stage: "payment_pending",
      })
      .eq("id", lead.id);

    if (updateError) {
      console.error("[asaas_create_subscription] Erro ao atualizar lead:", updateError);
    }

    // Registrar evento
    await supabase
      .from("events")
      .insert({
        lead_id: lead.id,
        type: "payment_created",
        metadata: {
          asaas_subscription_id: asaasSubscription.id,
          value: payload.value,
          cycle: payload.cycle || "MONTHLY",
          source: "asaas_create_subscription",
        },
      });

    // Registrar integração
    await supabase
      .from("integrations")
      .upsert({
        lead_id: lead.id,
        provider: "asaas",
        external_id: asaasSubscription.id,
        entity_type: "subscription",
        metadata: {
          value: payload.value,
          cycle: payload.cycle || "MONTHLY",
          created_at: new Date().toISOString(),
        },
      }, {
        onConflict: "provider,external_id",
      });

    // Criar registro na tabela subscriptions
    await supabase
      .from("subscriptions")
      .insert({
        lead_id: lead.id,
        asaas_subscription_id: asaasSubscription.id,
        status: "pending",
        metadata: {
          value: payload.value,
          cycle: payload.cycle || "MONTHLY",
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        asaas_subscription_id: asaasSubscription.id,
        already_exists: false,
        next_due_date: nextDueDateStr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[asaas_create_subscription] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
