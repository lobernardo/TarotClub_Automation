import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blog_post_id } = await req.json();
    if (!blog_post_id) {
      return new Response(JSON.stringify({ error: "blog_post_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: post, error: fetchErr } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", blog_post_id)
      .single();

    if (fetchErr || !post) {
      console.error("Post not found", fetchErr);
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!post.title || !post.content) {
      return new Response(
        JSON.stringify({ error: "title and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (post.status === "published") {
      return new Response(JSON.stringify({ ok: true, message: "Already published" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to queued
    await supabase
      .from("blog_posts")
      .update({ status: "queued", error_message: null })
      .eq("id", blog_post_id);

    // Send to Make webhook
    const webhookUrl = Deno.env.get("MAKE_BLOG_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("MAKE_BLOG_WEBHOOK_URL not configured");
    }

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-blog-secret": Deno.env.get("BLOG_WEBHOOK_SECRET") || "",
      },
      body: JSON.stringify({
        blog_post_id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image_url: post.featured_image_url,
        seo_keywords: post.seo_keywords,
        seo_description: post.seo_description,
      }),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text();
      console.error("Make webhook error:", errText);
      await supabase
        .from("blog_posts")
        .update({ status: "failed", error_message: `Webhook error: ${webhookRes.status}` })
        .eq("id", blog_post_id);
      return new Response(JSON.stringify({ error: "Webhook call failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await webhookRes.text(); // consume body

    return new Response(JSON.stringify({ ok: true, status: "queued" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("blog_publish error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
