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

  const coverImage =
    orderedImages[0]?.image_url || post.image_url || fetchedCoverImage || "";

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
      if (data?.image_url) setFetchedCoverImage(data.image_url);
    }
    fetchCover();
  }, [coverImage, post.id]);

  return (
    <div
      className="group relative flex flex-col gap-2 cursor-pointer break-inside-avoid mb-4"
      onClick={() => onClick(post)}
    >
      {/* ✅ Key fix: no fixed aspect ratio.
          Using position relative + natural image height gives Pinterest behavior.
          Each card is exactly as tall as its image — different images = different heights. */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-muted">
        {coverImage ? (
          // ✅ width/height 0 with paddingBottom trick is NOT needed with next/image
          // Use fill={false} and let width/height be natural via w-full + h-auto
          <img
            src={coverImage}
            alt={post.title}
            className={`w-full h-auto block rounded-2xl transition-transform duration-500 group-hover:scale-105 ${post.css_filter || ""}`}
          />
        ) : (
          // Placeholder keeps a rough shape while image loads
          <div className="w-full aspect-[4/5] bg-muted rounded-2xl animate-pulse" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      </div>

      {/* Card footer */}
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