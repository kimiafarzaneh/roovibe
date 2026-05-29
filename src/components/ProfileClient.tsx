"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Post, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "@/components/PostCard";
import { PostDetailModal } from "@/components/PostDetailModal";

interface ProfileClientProps {
  profile: Profile;
  posts: Post[];
}

export function ProfileClient({ profile, posts }: ProfileClientProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState({
    avatar_url: profile.avatar_url || "",
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    city: profile.city || "",
    telegram_handle: profile.telegram_handle || "",
    whatsapp_handle: profile.whatsapp_handle || "",
  });
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        avatar_url: profile.avatar_url || "",
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        city: profile.city || "",
        telegram_handle: profile.telegram_handle || "",
        whatsapp_handle: profile.whatsapp_handle || "",
      }),
    [profile]
  );
  const currentSnapshot = JSON.stringify(form);
  const isDirty = initialSnapshot !== currentSnapshot;

  const handleSave = async () => {
    setStatusMessage(null);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: form.avatar_url || null,
        display_name: form.display_name,
        bio: form.bio,
        city: form.city,
        telegram_handle: form.telegram_handle || null,
        whatsapp_handle: form.whatsapp_handle || null,
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      setStatusMessage({ kind: "error", text: "Could not save profile details." });
    } else {
      setStatusMessage({ kind: "success", text: "Profile updated successfully." });
      setEditing(false);
    }
    setSaving(false);
  };

  const handlePresetAvatar = (url: string) => {
    setForm((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleAvatarUpload = async (file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `avatar-${profile.id}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from("posts").upload(fileName, file, {
      upsert: true,
    });
    if (error) {
      setStatusMessage({ kind: "error", text: "Avatar upload failed." });
      return;
    }
    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(data.path);
    setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    setStatusMessage({ kind: "success", text: "Avatar uploaded. Save to apply." });
  };

  return (
    <div className="min-h-full px-4 py-4 space-y-6">
      <section className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-semibold">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
            ) : (
              form.display_name?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Your profile</h1>
            <p className="text-sm text-muted-foreground">Keep your storefront details updated.</p>
          </div>
          <div className="ms-auto">
            <Button variant={editing ? "outline" : "default"} onClick={() => setEditing((x) => !x)}>
              {editing ? "Cancel edit" : "Edit profile"}
            </Button>
          </div>
        </div>

        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Display name</p>
              <p className="font-medium">{form.display_name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City</p>
              <p className="font-medium">{form.city || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telegram</p>
              <p className="font-medium">{form.telegram_handle || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">WhatsApp</p>
              <p className="font-medium">{form.whatsapp_handle || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Bio</p>
              <p className="font-medium">{form.bio || "-"}</p>
            </div>
          </div>
        )}

        {editing && (
          <>
        <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => handlePresetAvatar("/avatars/man.svg")}>
              Man Avatar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handlePresetAvatar("/avatars/woman.svg")}>
              Woman Avatar
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={avatarInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              id="avatar-upload"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => avatarInputRef.current?.click()}
            >
              Upload Photo
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              value={form.display_name}
              onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="telegram_handle">Telegram</Label>
            <Input
              id="telegram_handle"
              placeholder="username without @"
              value={form.telegram_handle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, telegram_handle: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_handle">WhatsApp</Label>
            <Input
              id="whatsapp_handle"
              placeholder="98xxxxxxxxxx"
              value={form.whatsapp_handle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp_handle: e.target.value }))
              }
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
        </>
        )}
        {statusMessage && (
          <p
            className={`text-sm ${
              statusMessage.kind === "success" ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {statusMessage.text}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your posts</h2>
        {posts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={(p) => setSelectedPost(p)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No posts yet. Go to Create tab and publish your first product.
          </div>
        )}
      </section>

      <PostDetailModal
        post={selectedPost}
        isOpen={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
