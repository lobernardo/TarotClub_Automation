import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type BlogPost = Tables<"blog_posts">;

export function useBlogPosts() {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: TablesInsert<"blog_posts">) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog_posts"] }),
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"blog_posts"> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog_posts"] }),
  });

  const publishPost = useMutation({
    mutationFn: async (blog_post_id: string) => {
      const res = await supabase.functions.invoke("blog_publish", {
        body: { blog_post_id },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog_posts"] }),
  });

  return { postsQuery, createPost, updatePost, publishPost };
}
