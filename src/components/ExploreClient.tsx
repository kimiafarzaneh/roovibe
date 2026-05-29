"use client";

import { useMemo, useState } from "react";
import { Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import { PostDetailModal } from "@/components/PostDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExploreTag = {
  id: number;
  name: string;
};

interface ExploreClientProps {
  posts: Post[];
  tags: ExploreTag[];
}

export function ExploreClient({ posts, tags }: ExploreClientProps) {
  const [query, setQuery] = useState("");
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const activeTagName = tags.find((t) => t.id === activeTagId)?.name || null;

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTag =
        activeTagId === null ||
        post.post_tags?.some((pt) => pt.tags?.name === activeTagName);

      if (!matchesTag) return false;
      if (!q) return true;

      const haystack = [
        post.title,
        post.story || "",
        post.profiles?.display_name || "",
        post.profiles?.city || "",
        ...(post.post_tags?.map((pt) => pt.tags?.name || "") || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [posts, activeTagId, activeTagName, query]);

  return (
    <div className="min-h-full px-4 py-4 space-y-4">
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <h1 className="text-xl font-semibold tracking-tight">Explore creators and products</h1>
        <Input
          placeholder="Search by title, tag, creator, city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTagId === null ? "default" : "outline"}
            onClick={() => setActiveTagId(null)}
          >
            All
          </Button>
          {tags.map((tag) => (
            <Button
              key={tag.id}
              size="sm"
              variant={activeTagId === tag.id ? "default" : "outline"}
              onClick={() => setActiveTagId(tag.id)}
            >
              {tag.name}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredPosts.length} result(s)</span>
          {(query || activeTagId !== null) && (
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => {
                setQuery("");
                setActiveTagId(null);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onClick={(p) => setSelectedPost(p)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No matching posts yet. Try changing filters or search keywords.
        </div>
      )}

      <PostDetailModal
        post={selectedPost}
        isOpen={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
