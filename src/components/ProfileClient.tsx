"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/utils/supabase/client";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Post, Profile } from "@/types";
import {
  Check, Loader2, Pencil, LogOut,
  MapPin, Phone, Home, Grid2x2,
} from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  display_name: z.string().min(2, "At least 2 characters").max(50, "Max 50 characters"),
  username: z
    .string().min(3, "At least 3 characters").max(30, "Max 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  bio: z.string().max(200, "Max 200 characters").optional().or(z.literal("")),
  phone: z.string().regex(/^[0-9+]{10,15}$/, "Invalid phone number").optional().or(z.literal("")),
  city: z.string().max(60).optional().or(z.literal("")),
  address: z.string().max(200, "Max 200 characters").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileClientProps {
  profile: Profile;
  posts: Post[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileClient({ profile, posts }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { logoutUser, isPending: isLoggingOut } = useLogout();

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, watch, reset } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        city: profile.city || "",
        address: profile.address || "",
      },
    });

  const onSubmit = async (data: ProfileForm) => {
    setServerError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        username: data.username.toLowerCase(),
        bio: data.bio || null,
        phone: data.phone || null,
        city: data.city || null,
        address: data.address || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      if (error.message.includes("profiles_username_key")) {
        setServerError("This username is already taken.");
      } else {
        setServerError(error.message);
      }
      return;
    }

    setSaved(true);
    setIsEditing(false);
    // Update form defaults so isDirty resets correctly
    reset(data);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancelEdit = () => {
    reset(); // revert to defaultValues
    setServerError(null);
    setIsEditing(false);
  };

  // Current display values (use form watch so edit-mode changes reflect immediately)
  const currentValues = isEditing
    ? watch()
    : {
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        city: profile.city || "",
        address: profile.address || "",
      };

  // ─── View mode ───────────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-8">

        {/* Profile card */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">

          {/* Top row: avatar placeholder + name + actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar circle — initials for now */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
                {currentValues.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">
                  {currentValues.display_name || "—"}
                </h2>
                {currentValues.username && (
                  <p className="text-sm text-muted-foreground">@{currentValues.username}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutUser()}
                disabled={isLoggingOut}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                {isLoggingOut
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />
                }
                Sign out
              </Button>
            </div>
          </div>

          {/* Bio */}
          {currentValues.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentValues.bio}
            </p>
          )}

          {/* Info rows */}
          <div className="space-y-2 pt-1">
            {currentValues.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                {currentValues.city}
              </div>
            )}
            {currentValues.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                {currentValues.phone}
              </div>
            )}
            {currentValues.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="w-4 h-4 shrink-0" />
                {currentValues.address}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>

          {/* Saved confirmation */}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" /> Profile saved successfully
            </div>
          )}
        </div>

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Grid2x2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Your Posts
              </h3>
            </div>
            <div className="columns-2 md:columns-3 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="break-inside-avoid mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.post_images?.[0]?.image_url || post.image_url || ""}
                    alt={post.title}
                    className={`w-full h-auto rounded-2xl block ${post.css_filter || ""}`}
                  />
                  <p className="text-xs font-medium mt-1.5 px-0.5 line-clamp-1">{post.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">You haven't posted anything yet.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Edit mode ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">

      {/* Edit header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <h2 className="text-lg font-bold">Edit Profile</h2>
        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display name <span className="text-destructive">*</span></Label>
          <Input id="display_name" placeholder="How buyers see your name" {...register("display_name")} aria-invalid={!!errors.display_name} />
          {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input id="username" placeholder="your_username" className="pl-7" {...register("username")} aria-invalid={!!errors.username} />
          </div>
          <p className="text-xs text-muted-foreground">
            roovibe.com/@{watch("username") || "your_username"}
          </p>
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">
            Bio
            <span className="text-muted-foreground font-normal ml-1">({watch("bio")?.length ?? 0}/200)</span>
          </Label>
          <Textarea id="bio" placeholder="Tell buyers about yourself..." rows={3} {...register("bio")} />
          {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
        </div>

        <hr className="border-dashed" />

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" placeholder="09xxxxxxxxx" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="e.g. Tehran, Isfahan..." {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Shop / Studio address</Label>
          <Textarea id="address" placeholder="Full address if you have a physical location (optional)" rows={2} {...register("address")} />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting || !isDirty}>
            {isSubmitting
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
              : "Save changes"
            }
          </Button>
        </div>

        {!isDirty && (
          <p className="text-xs text-center text-muted-foreground">No unsaved changes</p>
        )}
      </form>
    </div>
  );
}