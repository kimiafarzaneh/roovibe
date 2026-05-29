import { createClient } from "@/utils/supabase/server";
import { ExploreClient } from "@/components/ExploreClient";
import { Post } from "@/types";

export default async function ExplorePage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: tags }] = await Promise.all([
    supabase
      .from("posts")
      .select(`
        *,
        post_images (
          id,
          image_url,
          display_order
        ),
        profiles!posts_creator_id_fkey (*),
        post_tags (
          tags ( name )
        )
      `)
      .order("created_at", { ascending: false }),
    supabase.from("tags").select("id,name").order("name"),
  ]);

  return (
    <ExploreClient
      posts={(posts || []) as unknown as Post[]}
      tags={(tags || []) as { id: number; name: string }[]}
    />
  );
}
