"use client";

import { useEffect, useMemo, useState } from "react";
import { Post } from "@/types";
import { supabase } from "@/utils/supabase/client";
import Image from "next/image";

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const primaryTag = post.post_tags?.[0]?.tags?.name;
  const [fetchedCoverImage, setFetchedCoverImage] = useState<string | null>(null);
  const orderedImages = useMemo(
    () =>
      [...(post.post_images || [])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    [post.post_images]
  );
  const coverImage = orderedImages[0]?.image_url || post.image_url || fetchedCoverImage || "";

  useEffect(() => {
    if (coverImage) return;
    async function fetchCover() {
      const { data } = await supabase
        .from("post_images")
        .select("image_url,display_order")
        .eq("post_id", post.id)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data?.image_url) {
        setFetchedCoverImage(data.image_url);
      }
    }
    fetchCover();
    console.log(coverImage)
    
  }, [coverImage, post.id, supabase]);

  return (
    
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer break-inside-avoid mb-4"
      onClick={() => onClick(post)}
    >
    <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-muted">
  {
  coverImage ? (
    <Image
      src={coverImage}
      alt={post.title}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${post.css_filter || ""}`}
    />
  ) : (
    <div className="aspect-[4/5] w-full bg-muted" />
  )}

  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
</div>
      
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm line-clamp-1">{post.title}</span>
          {post.price && (
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {post.price.toLocaleString()} T
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground line-clamp-1">
            {post.profiles?.display_name || "Unknown"}
          </span>
          {primaryTag && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
              {primaryTag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
