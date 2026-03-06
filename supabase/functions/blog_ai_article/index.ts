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
    const { title } = await req.json();

    if (!title || typeof title !== "string") {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "Você é um redator especialista em SEO para WordPress. Responda apenas com HTML válido.",
          },
          {
            role: "user",
            content: `Você é um especialista em SEO avançado, GEO (Generative Engine Optimization) e AI Search Optimization, com experiência em conteúdo que ranqueia no Google e também aparece em respostas de IA como ChatGPT, Gemini e Perplexity.

Sua tarefa é escrever um artigo completo para blog WordPress otimizado para SEO usando RankMath.

OBJETIVO

Criar um artigo altamente otimizado para performance de busca, autoridade e ranqueamento no nicho espiritual (tarô, tarot, registros akáshicos, espiritualidade e autoconhecimento).

PÚBLICO

Pessoas interessadas em espiritualidade, tarot/tarô, autoconhecimento, energia espiritual e registros akáshicos.

TOM

Espiritual, acolhedor, profundo e inspirador, mas também claro e educativo.

IDIOMA

Português do Brasil.

TAMANHO

Entre 1500 e 1800 palavras.

TEMA DO ARTIGO

${title}

INSTRUÇÕES SEO

1. Estruture o conteúdo para SEO e AI Search.

2. Use headings:

<h1>
<h2>
<h3>

3. Inclua naturalmente as variações:
   tarot e tarô.

4. O artigo deve responder perguntas reais que as pessoas fazem no Google.

5. Otimize o conteúdo para:

Featured Snippets
Buscas conversacionais
AI Search

ESTRUTURA OBRIGATÓRIA

Introdução

Seções com H2

Subseções com H3

Conteúdo aprofundado

FAQ SEO

Conclusão

CTA sugerindo:

consulta de tarot
acesso à página de serviços
clube do tarot
contato via WhatsApp

SEÇÃO DE PERGUNTAS FREQUENTES

Crie EXATAMENTE 5 perguntas frequentes.

Formato obrigatório:

<h2>Perguntas frequentes sobre ${title}</h2>

<ol>

<li>
<h3>Pergunta</h3>
<p>Resposta clara e direta.</p>
</li>

<li>
<h3>Pergunta</h3>
<p>Resposta clara e direta.</p>
</li>

<li>
<h3>Pergunta</h3>
<p>Resposta clara e direta.</p>
</li>

<li>
<h3>Pergunta</h3>
<p>Resposta clara e direta.</p>
</li>

<li>
<h3>Pergunta</h3>
<p>Resposta clara e direta.</p>
</li>

</ol>

REGRAS

• Não escreva "FAQ".
• Não escreva "Perguntas frequentes" duas vezes.
• Use obrigatoriamente lista numerada <ol>.

FORMATAÇÃO

Retorne SOMENTE HTML válido para WordPress.

Use apenas:

<h1>
<h2>
<h3>
<p>
<ol>
<ul>
<li>
<strong>

NÃO use markdown (#).`,
          },
        ],
      }),
    });

    if (!completionRes.ok) {
      const errorText = await completionRes.text();
      console.error("OpenAI completion error:", errorText);
      return new Response(JSON.stringify({ error: "AI completion failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const completion = await completionRes.json();
    const article = completion?.choices?.[0]?.message?.content;

    if (!article) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ article }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("blog_ai_article error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
