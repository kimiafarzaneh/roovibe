import { createClient } from "@/utils/supabase/server";
import { FeedClient } from "@/components/FeedClient";
import { Post } from "@/types";

export default async function FeedPage() {
  const supabase = await createClient();

  // Fetch posts with joined profiles and tags
  const { data: posts, error } = await supabase
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
    
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
  }

  // Cast type, supabase returns a complex mapped type
  const typedPosts = (posts || []) as unknown as Post[];

  return (
    <div className="min-h-full pb-8">
      <FeedClient posts={typedPosts} />
    </div>
  );
}
