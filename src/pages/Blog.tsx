import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Upload, ExternalLink, RefreshCw, Save, Send, Loader2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type BlogFormPost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  seo_keywords?: string | null;
  seo_description?: string | null;
};

export default function Blog() {
  const { postsQuery, createPost, publishPost, updatePost, updatePostMutation } = useBlogPosts();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [improvingTitle, setImprovingTitle] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setFeaturedImageUrl("");
    setSeoKeywords("");
    setSeoDescription("");
    setEditingPostId(null);
  };

  const fillFormForEditing = (post: BlogFormPost) => {
    setEditingPostId(post.id);
    setTitle(post.title ?? "");
    setSlug(post.slug ?? "");
    setExcerpt(post.excerpt ?? "");
    setContent(post.content ?? "");
    setFeaturedImageUrl(post.featured_image_url ?? "");
    setSeoKeywords(post.seo_keywords ?? "");
    setSeoDescription(post.seo_description ?? "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("blog-assets").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("blog-assets").getPublicUrl(path);
      setFeaturedImageUrl(urlData.publicUrl);
      toast({ title: "Imagem enviada com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const generateSeoSuggestions = async () => {
    if (!title) {
      alert("Digite um título primeiro");
      return;
    }

    setGeneratingSEO(true);
    try {
      const { data, error } = await supabase.functions.invoke("blog_ai_seo", {
        body: { title },
      });

      if (error) {
        console.error(error);
        alert("Erro ao gerar SEO");
        return;
      }

      setSeoKeywords(data?.keywords ?? "");
      setSeoDescription(data?.description ?? "");
      setExcerpt(data?.excerpt ?? "");
    } finally {
      setGeneratingSEO(false);
    }
  };

  const improveTitleWithAI = async () => {
    if (!title) {
      alert("Digite um título primeiro");
      return;
    }

    setImprovingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke("blog_ai_title", {
        body: { title },
      });

      if (error) {
        console.error(error);
        alert("Erro ao melhorar título");
        return;
      }

      const improvedTitle = data?.title;
      if (improvedTitle && typeof improvedTitle === "string") {
        handleTitleChange(improvedTitle);
      }
    } finally {
      setImprovingTitle(false);
    }
  };

  const getPostPayload = () => ({
    title,
    slug: slug || null,
    excerpt: excerpt || null,
    content,
    featured_image_url: featuredImageUrl || null,
    seo_keywords: seoKeywords || null,
    seo_description: seoDescription || null,
  });

  const handleSaveDraft = async () => {
    if (!title || !content) {
      toast({ title: "Título e conteúdo são obrigatórios", variant: "destructive" });
      return;
    }

    const payload = {
      ...getPostPayload(),
      status: "draft" as const,
    };

    try {
      if (editingPostId) {
        await updatePost(editingPostId, payload);
        toast({ title: "Rascunho atualizado!" });
      } else {
        await createPost.mutateAsync(payload);
        toast({ title: "Rascunho salvo!" });
      }
      resetForm();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    if (!title || !content) {
      toast({ title: "Título e conteúdo são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      let postId = editingPostId;

      if (editingPostId) {
        const updatedPost = await updatePost(editingPostId, {
          ...getPostPayload(),
          status: "draft",
        });
        postId = updatedPost.id;
      } else {
        const post = await createPost.mutateAsync({
          ...getPostPayload(),
          status: "draft",
        });
        postId = post.id;
      }

      await publishPost.mutateAsync(postId);
      toast({ title: "Post enviado para publicação!" });
      resetForm();
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await publishPost.mutateAsync(id);
      toast({ title: "Reenviado para publicação" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const generateArticleWithAI = async () => {
    if (!title) {
      alert("Digite um título primeiro");
      return;
    }

    setGeneratingArticle(true);
    try {
      const { data, error } = await supabase.functions.invoke("blog_ai_article", {
        body: { title },
      });

      if (error) {
        console.error(error);
        alert("Erro ao gerar artigo");
        return;
      }

      setContent(data.article);
    } finally {
      setGeneratingArticle(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-accent" />
            Blog
          </h1>
          <p className="text-muted-foreground mt-1">Gerenciar posts do site</p>
        </div>

        {/* Create Post */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{editingPostId ? "Editar rascunho" : "Criar novo post"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Título</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={improveTitleWithAI}
                    disabled={improvingTitle}
                  >
                    {improvingTitle ? "Melhorando..." : "✨ Melhorar com IA"}
                  </Button>
                </div>
                <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Título do post" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-do-post" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-foreground">Palavras-chave SEO</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSeoSuggestions}
                  disabled={generatingSEO}
                >
                  {generatingSEO ? "Gerando SEO..." : "✨ Gerar SEO com IA"}
                </Button>
              </div>
              <Input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="Ex.: tarot online, tiragem de cartas, autoconhecimento"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descrição SEO</label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Resumo otimizado para mecanismos de busca"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Resumo do artigo (Excerpt)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <Button
                type="button"
                variant="secondary"
                onClick={generateArticleWithAI}
                disabled={generatingArticle}
              >
                {generatingArticle ? "Gerando artigo..." : "✨ Gerar artigo com IA"}
              </Button>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conteúdo do post..."
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Imagem destacada</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-sm">{uploading ? "Enviando..." : "Upload"}</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {featuredImageUrl && (
                  <div className="relative">
                    <img
                      src={featuredImageUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImageUrl("")}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createPost.isPending || updatePostMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingPostId ? "Atualizar rascunho" : "Salvar rascunho"}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={createPost.isPending || updatePostMutation.isPending || publishPost.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar no Blog
              </Button>
              {editingPostId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {postsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !postsQuery.data?.length ? (
              <p className="text-muted-foreground text-center py-8">Nenhum post criado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postsQuery.data.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[post.status] || ""} variant="secondary">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(post.created_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fillFormForEditing(post as BlogFormPost)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                          )}
                          {post.status === "published" && post.wp_post_url ? (
                            <a href={post.wp_post_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" /> Abrir no site
                              </Button>
                            </a>
                          ) : post.status === "failed" ? (
                            <Button variant="outline" size="sm" onClick={() => handleRetry(post.id)}>
                              <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
