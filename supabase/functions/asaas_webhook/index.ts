/**
 * Edge Function: asaas_webhook
 * 
 * Endpoint único para receber todos os webhooks do Asaas.
 * Atualiza stage do lead conforme eventos de pagamento.
 * 
 * Endpoint: POST /functions/v1/asaas_webhook
 * 
 * Eventos suportados:
 * - PAYMENT_CREATED: pagamento criado
 * - PAYMENT_CONFIRMED: pagamento confirmado
 * - PAYMENT_RECEIVED: pagamento recebido
 * - PAYMENT_OVERDUE: pagamento atrasado
 * - PAYMENT_DELETED: pagamento deletado
 * - PAYMENT_REFUNDED: pagamento estornado
 * - SUBSCRIPTION_CREATED: assinatura criada
 * - SUBSCRIPTION_UPDATED: assinatura atualizada
 * - SUBSCRIPTION_DELETED: assinatura cancelada
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: string;
    billingType: string;
    confirmedDate?: string;
    paymentDate?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    cycle: string;
  };
}

// Mapeamento de eventos para stages
const EVENT_STAGE_MAP: Record<string, string> = {
  "PAYMENT_CONFIRMED": "subscribed_active",
  "PAYMENT_RECEIVED": "subscribed_active",
  "PAYMENT_OVERDUE": "subscribed_past_due",
  "PAYMENT_REFUNDED": "subscribed_canceled",
  "SUBSCRIPTION_DELETED": "subscribed_canceled",
};

// Mapeamento de eventos para tipos de evento no banco
const EVENT_TYPE_MAP: Record<string, string> = {
  "PAYMENT_CREATED": "payment_created",
  "PAYMENT_CONFIRMED": "payment_confirmed",
  "PAYMENT_RECEIVED": "payment_confirmed",
  "PAYMENT_OVERDUE": "payment_overdue",
  "PAYMENT_DELETED": "payment_canceled",
  "PAYMENT_REFUNDED": "payment_refunded",
  "SUBSCRIPTION_CREATED": "subscription_created",
  "SUBSCRIPTION_UPDATED": "subscription_updated",
  "SUBSCRIPTION_DELETED": "subscription_canceled",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[asaas_webhook] Request received");

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar token do webhook (opcional, mas recomendado)
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");
    
    if (webhookToken && receivedToken !== webhookToken) {
      console.warn("[asaas_webhook] Token inválido");
      // Não retornar erro para evitar retry do Asaas
      // mas logar o evento suspeito
    }

    const payload: AsaasWebhookPayload = await req.json();
    console.log("[asaas_webhook] Payload:", JSON.stringify(payload));

    const { event, payment, subscription } = payload;

    if (!event) {
      console.warn("[asaas_webhook] Evento não especificado");
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado - tipo não especificado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolver lead pelo customer ID ou subscription ID
    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    if (payment) {
      customerId = payment.customer;
      subscriptionId = payment.subscription || null;
    } else if (subscription) {
      customerId = subscription.customer;
      subscriptionId = subscription.id;
    }

    if (!customerId) {
      console.warn("[asaas_webhook] Customer ID não encontrado no payload");
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado - customer não identificado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar lead pelo asaas_customer_id
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, stage, asaas_customer_id, asaas_subscription_id")
      .eq("asaas_customer_id", customerId)
      .limit(1)
      .maybeSingle();

    if (leadError) {
      console.error("[asaas_webhook] Erro ao buscar lead:", leadError);
    }

    if (!lead) {
      console.warn(`[asaas_webhook] Lead não encontrado para customer: ${customerId}`);
      return new Response(
        JSON.stringify({ success: true, message: "Lead não encontrado - evento registrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[asaas_webhook] Lead encontrado: ${lead.id}, stage atual: ${lead.stage}`);

    // Determinar novo stage baseado no evento
    const newStage = EVENT_STAGE_MAP[event];
    const eventType = EVENT_TYPE_MAP[event] || event.toLowerCase();

    // Atualizar stage do lead se necessário
    if (newStage && newStage !== lead.stage) {
      console.log(`[asaas_webhook] Atualizando stage via RPC: ${lead.stage} -> ${newStage}`);
      
      const { error: rpcError } = await supabase.rpc("update_lead_stage", {
        p_lead_id: lead.id,
        p_new_stage: newStage,
        p_reason: `asaas_webhook_${event}`,
      });

      if (rpcError) {
        console.error("[asaas_webhook] Erro ao atualizar stage via RPC:", rpcError);
      }
    }

    // Registrar evento do webhook
    await supabase
      .from("events")
      .insert({
        lead_id: lead.id,
        type: eventType,
        metadata: {
          asaas_event: event,
          payment_id: payment?.id || null,
          subscription_id: subscriptionId,
          value: payment?.value || subscription?.value || null,
          status: payment?.status || subscription?.status || null,
          source: "asaas_webhook",
        },
      });

    // Atualizar subscription se existir
    if (subscriptionId) {
      const subscriptionStatus = event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED"
        ? "active"
        : event === "PAYMENT_OVERDUE"
        ? "past_due"
        : event === "SUBSCRIPTION_DELETED"
        ? "canceled"
        : null;

      if (subscriptionStatus) {
        await supabase
          .from("subscriptions")
          .update({
            status: subscriptionStatus,
            canceled_at: subscriptionStatus === "canceled" ? new Date().toISOString() : null,
          })
          .eq("asaas_subscription_id", subscriptionId);
      }
    }

    // Registrar/atualizar integração
    if (payment?.id) {
      await supabase
        .from("integrations")
        .upsert({
          lead_id: lead.id,
          provider: "asaas",
          external_id: payment.id,
          entity_type: "payment",
          metadata: {
            event,
            value: payment.value,
            status: payment.status,
            updated_at: new Date().toISOString(),
          },
        }, {
          onConflict: "provider,external_id",
        });
    }

    console.log(`[asaas_webhook] Evento ${event} processado com sucesso para lead ${lead.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        event,
        new_stage: newStage || lead.stage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[asaas_webhook] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Retornar 200 para evitar retry infinito do Asaas
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
