"use client";

import { useState } from "react";
import { Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import { PostDetailModal } from "@/components/PostDetailModal";

interface FeedClientProps {
  posts: Post[];
}

export function FeedClient({ posts }: FeedClientProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <>
      {posts.length > 0 ? (
        <div className="p-4 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={(p) => setSelectedPost(p)}
            />
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No posts yet. Be the first creator to publish.
          </div>
        </div>
      )}

      <PostDetailModal
        post={selectedPost}
        isOpen={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}
