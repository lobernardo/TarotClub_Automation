# 1. Introdução

Este documento descreve **apenas** o que foi identificado no código do repositório sobre o sistema de geração e publicação automática de artigos do blog.

Critério aplicado nesta investigação:

- Não assumir comportamentos não explícitos em código.
- Não deduzir integrações não implementadas diretamente.
- Quando não encontrado no código, registrar explicitamente como **"não encontrado no repositório"**.

---

# 2. Arquitetura geral do sistema

## 2.1 Componentes encontrados

1. **Frontend React** (rota `/blog`) para criação/edição/publicação de posts.
2. **Supabase Edge Functions**:
   - `blog_ai_article`
   - `blog_ai_title`
   - `blog_publish`
   - `blog_publish_result`
3. **Tabela `blog_posts`** (estrutura inferida a partir de tipos gerados no frontend).
4. **Webhook externo (Make)** acionado pela function `blog_publish`.
5. **Campos de retorno de publicação WordPress** armazenados em `blog_posts` (`wp_post_id`, `wp_post_url`) via `blog_publish_result`.

## 2.2 Componentes esperados mas não encontrados

- Function `blog_ai_seo` em `supabase/functions/`: **não encontrada no repositório**.
- Definição SQL (migration) da tabela `blog_posts`: **não encontrada no repositório**.
- Publicação direta em API WordPress dentro do código deste repositório: **não encontrada no repositório**.

---

# 3. Fluxo completo da automação

## 3.1 Fluxo de edição e IA no frontend

Na página `/blog`, o usuário preenche campos (título, slug, conteúdo etc.) e pode acionar 3 botões de IA:

- `✨ Melhorar com IA` → `supabase.functions.invoke("blog_ai_title")`.
- `✨ Gerar SEO com IA` → `supabase.functions.invoke("blog_ai_seo")`.
- `✨ Gerar artigo com IA` → `supabase.functions.invoke("blog_ai_article")`.

## 3.2 Fluxo de salvar rascunho

- Botão **Salvar rascunho**:
  - Se estiver editando (`editingPostId`): faz `update` no `blog_posts` com `status: "draft"`.
  - Se for novo post: faz `insert` no `blog_posts` com `status: "draft"`.

## 3.3 Fluxo de publicar

1. Frontend garante presença de `title` e `content`.
2. Frontend salva/atualiza como `draft` no `blog_posts`.
3. Frontend chama `supabase.functions.invoke("blog_publish", { blog_post_id })`.
4. `blog_publish`:
   - Busca post no `blog_posts`.
   - Valida presença de `title` e `content`.
   - Se já `published`, retorna `Already published`.
   - Atualiza status para `queued`.
   - Envia payload JSON para webhook do Make (`MAKE_BLOG_WEBHOOK_URL`), com header `x-blog-secret`.
5. Processamento externo (Make/WordPress) ocorre fora deste repositório.
6. Retorno esperado do Make para `blog_publish_result`:
   - atualiza `status` (`published`, `failed`, etc.),
   - grava `wp_post_id`, `wp_post_url`, `make_execution_id`, `error_message`,
   - define `published_at` quando `status === "published"`.

---

# 4. Estrutura do editor de posts

## 4.1 Rota

- Página acessível em `/blog` (protegida por `ProtectedRoute`).

## 4.2 Campos do formulário

Campos controlados por estado na página `src/pages/Blog.tsx`:

- `title`
- `slug`
- `seoKeywords`
- `seoDescription`
- `excerpt`
- `content`
- `featuredImageUrl`

## 4.3 Upload de imagem destacada

- Upload para bucket Supabase Storage `blog-assets`.
- Nome de arquivo gerado como `${crypto.randomUUID()}.${ext}`.
- URL pública obtida com `getPublicUrl` e salva em `featuredImageUrl`.

## 4.4 Lista de posts no editor

- Busca em `blog_posts` ordenado por `created_at desc`.
- Exibe status com badges (`draft`, `queued`, `published`, `failed`).
- Ações por linha:
  - `Editar` para status `draft`.
  - `Abrir no site` quando `published` e houver `wp_post_url`.
  - `Tentar novamente` quando `failed` (chama publicação de novo).

---

# 5. Geração de título com IA

## 5.1 Edge Function

- **Function:** `blog_ai_title`
- **Arquivo:** `supabase/functions/blog_ai_title/index.ts`
- **Endpoint:** Supabase Edge Function `blog_ai_title` (URL completa não está hardcoded; no frontend é chamada por `supabase.functions.invoke("blog_ai_title")`).

## 5.2 Payload recebido

```json
{ "title": "string" }
```

## 5.3 Payload retornado

Sucesso:

```json
{ "title": "<improvedTitle>" }
```

Erros possíveis:

```json
{ "error": "title is required" }
{ "error": "OPENAI_API_KEY not configured" }
{ "error": "AI completion failed" }
{ "error": "Empty AI response" }
{ "error": "Invalid AI response" }
{ "error": "<mensagem de exceção>" }
```

## 5.4 Modelo de IA

- OpenAI Chat Completions
- `model: "gpt-4o-mini"`
- `temperature: 0.5`
- `response_format: { "type": "json_object" }`

## 5.5 Prompt completo usado

### system

```text
Você melhora títulos para SEO em blogs espirituais. Responda sempre em JSON no formato {"title":"..."} com 50-70 caracteres.
```

### user

```text
Melhore este título para SEO e blog espiritual. Mantenha claro, natural e chamativo.

Título: ${title}
```

## 5.6 Tratamento de erro

- Valida `title` (400).
- Valida `OPENAI_API_KEY` (500).
- Trata falha HTTP da OpenAI (502).
- Trata resposta vazia/inválida (502).
- `catch` final retorna 500 com `err.message`.

## 5.7 Variáveis de ambiente usadas

- `OPENAI_API_KEY`

---

# 6. Geração de SEO com IA

## 6.1 Situação encontrada

No frontend existe chamada para `supabase.functions.invoke("blog_ai_seo")`, com preenchimento de:

- `seoKeywords` ← `data?.keywords`
- `seoDescription` ← `data?.description`
- `excerpt` ← `data?.excerpt`

Porém, a function `supabase/functions/blog_ai_seo/index.ts` **não foi encontrada no repositório**.

## 6.2 Itens solicitados que não podem ser documentados por ausência de código

Para `blog_ai_seo`, os seguintes itens estão **não encontrados no repositório**:

- prompt completo
- modelo de IA
- tratamento de erro
- variáveis de ambiente
- payload real de entrada/saída na function

---

# 7. Geração de artigo com IA

## 7.1 Edge Function

- **Function:** `blog_ai_article`
- **Arquivo:** `supabase/functions/blog_ai_article/index.ts`
- **Endpoint:** Supabase Edge Function `blog_ai_article` (URL completa não está hardcoded; no frontend é chamada por `supabase.functions.invoke("blog_ai_article")`).

## 7.2 Payload recebido

```json
{ "title": "string" }
```

## 7.3 Payload retornado

Sucesso:

```json
{ "article": "<html>...</html>" }
```

Erros possíveis:

```json
{ "error": "title is required" }
{ "error": "OPENAI_API_KEY not configured" }
{ "error": "AI completion failed" }
{ "error": "Empty AI response" }
{ "error": "<mensagem de exceção>" }
```

## 7.4 Modelo de IA

- OpenAI Chat Completions
- `model: "gpt-4o-mini"`
- `temperature: 0.7`

## 7.5 Prompt completo usado

### system

```text
Você é um redator especialista em SEO para WordPress. Responda apenas com HTML válido.
```

### user

```text
Você é um especialista em SEO avançado, GEO (Generative Engine Optimization) e AI Search Optimization, com experiência em conteúdo que ranqueia no Google e também aparece em respostas de IA como ChatGPT, Gemini e Perplexity.

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

NÃO use markdown (#).
```

## 7.6 Tratamento de erro

- Valida `title` (400).
- Valida `OPENAI_API_KEY` (500).
- Trata falha HTTP da OpenAI (502).
- Trata resposta vazia (502).
- `catch` final retorna 500 com `err.message`.

## 7.7 Variáveis de ambiente usadas

- `OPENAI_API_KEY`

---

# 8. Estrutura do CTA automático

## 8.1 O que existe no código

No prompt de `blog_ai_article` há instrução textual para incluir CTA sugerindo:

- consulta de tarot
- acesso à página de serviços
- clube do tarot
- contato via WhatsApp

## 8.2 O que não foi encontrado

- Inserção programática de seção de CTA (por pós-processamento de HTML): **não encontrada no repositório**.
- Presença explícita dos links abaixo hardcoded no código:
  - `https://veranahalma.com.br/clube-do-tarot/`
  - `https://wa.me/5521967306840`

Resultado: os links esperados estão **não encontrados no repositório**.

---

# 9. Estrutura do FAQ

## 9.1 Estrutura exigida pelo prompt do artigo

A function `blog_ai_article` exige no prompt:

- seção com:
  - `<h2>Perguntas frequentes sobre ${title}</h2>`
- lista numerada `<ol>`
- **exatamente 5** itens `<li>`
- cada item com:
  - `<h3>Pergunta</h3>`
  - `<p>Resposta clara e direta.</p>`

## 9.2 JSON-LD / FAQ Schema

Busca no repositório por JSON-LD/schema FAQ:

- `application/ld+json`, `FAQPage`, `schema.org`, `json-ld`.

Resultado: **não encontrado no repositório**.

---

# 10. Publicação automática via Make

## 10.1 Edge Function principal

- **Function:** `blog_publish`
- **Arquivo:** `supabase/functions/blog_publish/index.ts`

## 10.2 Endpoint

- Invocada do frontend como `supabase.functions.invoke("blog_publish")`.
- URL HTTP completa não está hardcoded no frontend.

## 10.3 Payload recebido por `blog_publish`

```json
{ "blog_post_id": "<uuid>" }
```

## 10.4 Validações e estado

- Exige `blog_post_id` (400).
- Busca o post em `blog_posts`.
- Retorna 404 se não encontrar.
- Exige `title` e `content` no registro (400).
- Se já estiver `published`, retorna `{ ok: true, message: "Already published" }`.
- Atualiza status para `queued` antes de chamar webhook.

## 10.5 Webhook Make chamado

- URL vinda da env var `MAKE_BLOG_WEBHOOK_URL`.
- Método: `POST`.
- Headers:
  - `Content-Type: application/json`
  - `x-blog-secret: BLOG_WEBHOOK_SECRET || ""`

## 10.6 Estrutura exata enviada para Make

```json
{
  "blog_post_id": "post.id",
  "title": "post.title",
  "slug": "post.slug",
  "content": "post.content",
  "excerpt": "post.excerpt",
  "featured_image_url": "post.featured_image_url",
  "seo_keywords": "post.seo_keywords",
  "seo_description": "post.seo_description"
}
```

Os campos esperados no pedido estão de fato presentes no corpo enviado.

## 10.7 Tratamento de erro no webhook

- Se webhook retornar não-2xx:
  - atualiza `blog_posts.status = "failed"`
  - grava `error_message = "Webhook error: <status>"`
  - retorna 502.
- Exceções gerais retornam 500 com `err.message`.

## 10.8 Variáveis de ambiente usadas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MAKE_BLOG_WEBHOOK_URL`
- `BLOG_WEBHOOK_SECRET`

---

# 11. Integração com WordPress

## 11.1 O que está implementado no repositório

Não há chamada direta para API do WordPress na function `blog_publish`.

O fluxo implementado é:

- Supabase `blog_publish` → webhook Make
- Make (externo ao repositório) processa publicação
- Make chama `blog_publish_result` para atualizar resultado

## 11.2 Campos de retorno relacionados a WordPress

Na `blog_publish_result`, o body aceito inclui:

- `wp_post_id`
- `wp_post_url`

Esses campos são salvos em `blog_posts`.

## 11.3 Segurança no callback

`blog_publish_result` valida header `x-blog-secret` contra `BLOG_WEBHOOK_SECRET`.

Se inválido:

- retorna 401 `Unauthorized`.

---

# 12. Estrutura do banco de dados

## 12.1 Tabela `blog_posts` (a partir de tipos gerados)

Estrutura encontrada em `src/integrations/supabase/types.ts`:

- `id: string`
- `author_user_id: string | null`
- `title: string`
- `slug: string | null`
- `excerpt: string | null`
- `content: string`
- `featured_image_url: string | null`
- `status: string`
- `error_message: string | null`
- `wp_post_id: string | null`
- `wp_post_url: string | null`
- `make_execution_id: string | null`
- `published_at: string | null`
- `created_at: string`
- `updated_at: string`

## 12.2 Campos usados na publicação

Na function `blog_publish`, usados para payload externo:

- `id`
- `title`
- `slug`
- `content`
- `excerpt`
- `featured_image_url`
- `seo_keywords`
- `seo_description`

Observação factual: `seo_keywords` e `seo_description` são usados em frontend + payload do webhook, mas **não aparecem na tipagem gerada de `blog_posts`** em `src/integrations/supabase/types.ts`.

## 12.3 SQL de criação da tabela

`CREATE TABLE blog_posts` em migrations locais: **não encontrado no repositório**.

---

# 13. Variáveis de ambiente utilizadas

## 13.1 `blog_ai_title`

- `OPENAI_API_KEY`

## 13.2 `blog_ai_article`

- `OPENAI_API_KEY`

## 13.3 `blog_publish`

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MAKE_BLOG_WEBHOOK_URL`
- `BLOG_WEBHOOK_SECRET`

## 13.4 `blog_publish_result`

- `BLOG_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 13.5 Configuração de JWT

No `supabase/config.toml`, há `verify_jwt = false` para:

- `blog_publish`
- `blog_publish_result`

Configuração explícita para `blog_ai_title` e `blog_ai_article`: **não encontrada no repositório**.

---

# 14. Fluxo completo passo a passo

1. Usuário acessa `/blog`.
2. Preenche título/conteúdo e demais campos.
3. Opcionalmente usa IA para:
   - melhorar título (`blog_ai_title`),
   - gerar SEO (`blog_ai_seo`, function ausente neste repositório),
   - gerar artigo (`blog_ai_article`).
4. Usuário salva rascunho (`status: draft`) em `blog_posts`.
5. Ao publicar:
   - frontend garante persistência do post,
   - chama `blog_publish` com `blog_post_id`.
6. `blog_publish`:
   - valida post,
   - marca como `queued`,
   - envia webhook ao Make com conteúdo completo.
7. Make executa fluxo externo (publicação WordPress não visível neste repositório).
8. Make chama `blog_publish_result` com status final e dados do post WP.
9. `blog_publish_result` valida secret e atualiza `blog_posts`.
10. Frontend lista status e, se publicado com URL, exibe botão “Abrir no site”.

---

# 15. Pontos de melhoria futuros

> Seção baseada em lacunas objetivamente observáveis no código atual, sem deduzir comportamento externo.

1. **Adicionar `blog_ai_seo` ao repositório** (arquivo function ausente).
2. **Versionar migration SQL de `blog_posts`** no diretório `supabase/migrations`.
3. **Alinhar tipagem `blog_posts` com uso real** de `seo_keywords` e `seo_description`.
4. **Definir explicitamente `verify_jwt` para todas as functions de blog** no `supabase/config.toml`.
5. **Padronizar tratamento de erro no frontend de IA** (atualmente usa `alert` para alguns casos).
6. **Se necessário para SEO estruturado**, incluir geração explícita de JSON-LD/FAQ Schema (atualmente não encontrado no repositório).

