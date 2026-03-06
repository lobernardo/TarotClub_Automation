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
import { FileText, Upload, ExternalLink, RefreshCw, Save, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Blog() {
  const { postsQuery, createPost, publishPost } = useBlogPosts();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setFeaturedImageUrl("");
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

  const handleSaveDraft = async () => {
    if (!title || !content) {
      toast({ title: "Título e conteúdo são obrigatórios", variant: "destructive" });
      return;
    }
    try {
      await createPost.mutateAsync({
        title,
        slug: slug || null,
        excerpt: excerpt || null,
        content,
        featured_image_url: featuredImageUrl || null,
        status: "draft",
      });
      toast({ title: "Rascunho salvo!" });
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
      const post = await createPost.mutateAsync({
        title,
        slug: slug || null,
        excerpt: excerpt || null,
        content,
        featured_image_url: featuredImageUrl || null,
        status: "draft",
      });
      await publishPost.mutateAsync(post.id);
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
            <CardTitle>Criar novo post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do post" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-do-post" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resumo</label>
              <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Resumo curto do post" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
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
                      onClick={() => setFeaturedImageUrl(null)}
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
                disabled={createPost.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar rascunho
              </Button>
              <Button
                onClick={handlePublish}
                disabled={createPost.isPending || publishPost.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar no Blog
              </Button>
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
                    <TableHead>Link WordPress</TableHead>
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
