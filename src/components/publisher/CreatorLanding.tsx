"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Store } from "lucide-react";

export function CreatorLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOpenStudio = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_creator: true })
      .eq("id", user.id);

    if (!error) {
      router.refresh();
    } else {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <Sparkles className="w-12 h-12" />
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Open Your Studio</h1>
        <p className="text-muted-foreground text-lg px-4">
          Become a creator and share your craft directly with your local community. Zero fees. Zero algorithms.
        </p>
      </div>

      <div className="w-full space-y-4 text-left px-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Palette className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold">Showcase Your Work</h3>
            <p className="text-sm text-muted-foreground">High-quality visual masonry feed.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold">Direct Sales</h3>
            <p className="text-sm text-muted-foreground">Customers order directly via Telegram/WhatsApp.</p>
          </div>
        </div>
      </div>

      <div className="pt-8 w-full">
        <Button size="lg" className="w-full rounded-full" onClick={handleOpenStudio} disabled={loading}>
          {loading ? "Opening..." : "Create My Studio"}
        </Button>
      </div>
    </div>
  );
}
