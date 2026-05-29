import { createClient } from "@/utils/supabase/server";
import { ProfileClient } from "@/components/ProfileClient";
import { Post, Profile } from "@/types";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-full p-4">
        <div className="rounded-2xl border border-dashed p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold">Sign in to manage your profile</h1>
          <p className="text-muted-foreground">
            Update your creator details and manage your posts from one place.
          </p>
          <Button variant="outline">
            <Link href="/">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
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
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) {
    return (
      <div className="min-h-full p-4">
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Profile not found.
        </div>
      </div>
    );
  }

  return (
    <ProfileClient
      profile={profile as Profile}
      posts={(posts || []) as unknown as Post[]}
    />
  );
}
