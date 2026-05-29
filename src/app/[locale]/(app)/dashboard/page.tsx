import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CreatorLanding } from "@/components/publisher/CreatorLanding";
import { ImagePublisher } from "@/components/publisher/ImagePublisher";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/"); // Not logged in
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

 

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative max-w-lg mx-auto w-full">
      {profile?.is_creator ? (
        <ImagePublisher />
      ) : (
        <CreatorLanding />
      )}
    </div>
  );
}
