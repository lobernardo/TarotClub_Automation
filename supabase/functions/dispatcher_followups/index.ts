import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 40 seconds between messages
const RATE_LIMIT_SECONDS = 40;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[dispatcher_followups] Starting execution at", new Date().toISOString());

  try {
    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Check rate limit - get last sent message
    const { data: lastSent, error: lastSentError } = await supabase
      .from("message_queue")
      .select("sent_at")
      .eq("status", "sent")
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSentError) {
      console.error("[dispatcher_followups] Error fetching last sent:", lastSentError);
      throw lastSentError;
    }

    // Check if we're within rate limit window
    if (lastSent?.sent_at) {
      const lastSentTime = new Date(lastSent.sent_at).getTime();
      const now = Date.now();
      const secondsSinceLastSend = (now - lastSentTime) / 1000;

      if (secondsSinceLastSend < RATE_LIMIT_SECONDS) {
        const waitTime = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastSend);
        console.log(
          `[dispatcher_followups] Rate limited. Last send was ${secondsSinceLastSend.toFixed(1)}s ago. ` +
          `Must wait ${waitTime}s more.`
        );
        return new Response(
          JSON.stringify({
            success: true,
            action: "rate_limited",
            message: `Rate limited. Wait ${waitTime}s before next send.`,
            last_sent_at: lastSent.sent_at,
            seconds_since_last: secondsSinceLastSend.toFixed(1),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Step 2: Get next eligible message
    const nowIso = new Date().toISOString();
    console.log("[dispatcher_followups] Looking for scheduled messages at or before:", nowIso);

    const { data: nextMessage, error: nextError } = await supabase
      .from("message_queue")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) {
      console.error("[dispatcher_followups] Error fetching next message:", nextError);
      throw nextError;
    }

    if (!nextMessage) {
      console.log("[dispatcher_followups] No eligible messages in queue");
      return new Response(
        JSON.stringify({
          success: true,
          action: "no_messages",
          message: "No messages eligible for dispatch",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[dispatcher_followups] Found eligible message:", {
      id: nextMessage.id,
      lead_id: nextMessage.lead_id,
      template_key: nextMessage.template_key,
      scheduled_for: nextMessage.scheduled_for,
    });

    // Step 3: Simulate send (STUB - no real message sent)
    console.log("==============================================");
    console.log("[STUB] SIMULATING MESSAGE SEND:");
    console.log(`  Lead ID: ${nextMessage.lead_id}`);
    console.log(`  Template Key: ${nextMessage.template_key}`);
    console.log(`  Stage: ${nextMessage.stage}`);
    console.log(`  Scheduled For: ${nextMessage.scheduled_for}`);
    console.log(`  Actual Send Time: ${nowIso}`);
    console.log("==============================================");

    // Step 4: Update message status to 'sent'
    const { error: updateError } = await supabase
      .from("message_queue")
      .update({
        status: "sent",
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", nextMessage.id)
      .eq("status", "scheduled"); // Double-check status to prevent race conditions

    if (updateError) {
      console.error("[dispatcher_followups] Error updating message status:", updateError);
      throw updateError;
    }

    console.log("[dispatcher_followups] Message marked as sent:", nextMessage.id);

    return new Response(
      JSON.stringify({
        success: true,
        action: "sent",
        message: "Message dispatched (simulated)",
        dispatched: {
          id: nextMessage.id,
          lead_id: nextMessage.lead_id,
          template_key: nextMessage.template_key,
          stage: nextMessage.stage,
          scheduled_for: nextMessage.scheduled_for,
          sent_at: nowIso,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("[dispatcher_followups] Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
