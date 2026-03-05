import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-blog-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate secret
    const secret = req.headers.get("x-blog-secret");
    const expected = Deno.env.get("BLOG_WEBHOOK_SECRET");
    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      blog_post_id,
      status,
      wp_post_id,
      wp_post_url,
      make_execution_id,
      error_message,
    } = await req.json();

    if (!blog_post_id || !status) {
      return new Response(
        JSON.stringify({ error: "blog_post_id and status required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const updateData: Record<string, unknown> = {
      status,
      wp_post_id: wp_post_id || null,
      wp_post_url: wp_post_url || null,
      make_execution_id: make_execution_id || null,
      error_message: error_message || null,
    };

    if (status === "published") {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", blog_post_id);

    if (error) {
      console.error("Update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("blog_publish_result error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
