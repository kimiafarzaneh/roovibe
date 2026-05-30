"use client";

import { useEffect, useMemo, useState } from "react";
import { Post } from "@/types";
import { supabase } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Phone, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const postId = post?.id;

  const [fetchedImagesState, setFetchedImagesState] = useState<{
    postId: string | null;
    urls: string[];
  }>({ postId: null, urls: [] });

  const sortedImages = useMemo(
    () =>
      [...(post?.post_images || [])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    [post?.post_images]
  );

  const imageUrls = sortedImages.length
    ? sortedImages.map((img) => img.image_url)
    : post?.image_url
      ? [post.image_url]
      : fetchedImagesState.postId === postId
        ? fetchedImagesState.urls
        : [];

  useEffect(() => {
    if (!postId || !isOpen || imageUrls.length > 0) return;
    async function loadImages() {
      const { data } = await supabase
        .from("post_images")
        .select("image_url,display_order")
        .eq("post_id", postId)
        .order("display_order", { ascending: true });
      const urls = (data || []).map((x) => x.image_url).filter(Boolean);
      if (urls.length > 0) {
        setFetchedImagesState({ postId: postId ?? null, urls });
      }
    }
    loadImages();
  }, [postId, isOpen, imageUrls.length]);

  // Track view — silent fail if table not ready
  useEffect(() => {
    if (!postId || !isOpen) return;
    supabase
      .from("post_analytics")
      .insert({ post_id: postId, event_type: "view" })
      .then(({ error }) => {
        // Silent — don't block UX if analytics table isn't set up yet
        if (error && process.env.NODE_ENV === "development") {
          console.warn("Analytics not tracking (table may not exist):", error);
        }
      });
  }, [postId, isOpen]);

  if (!post) return null;

  const profile = post.profiles;
  const contactInfo = post?.contact_info;

  const normalizedContact = Array.isArray(contactInfo)
    ? {
        sms: contactInfo.find((x) => x.type === "sms")?.value || "",
        telegram: contactInfo.find((x) => x.type === "telegram")?.value || "",
        whatsapp: contactInfo.find((x) => x.type === "whatsapp")?.value || "",
      }
    : {
        sms: contactInfo?.sms || "",
        telegram: contactInfo?.telegram || "",
        whatsapp: contactInfo?.whatsapp || "",
      };

  const availableContacts = [
    normalizedContact.telegram
      ? { method: "telegram" as const, label: "Telegram", icon: MessageCircle, value: normalizedContact.telegram }
      : null,
    normalizedContact.whatsapp
      ? { method: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, value: normalizedContact.whatsapp }
      : null,
    normalizedContact.sms
      ? { method: "sms" as const, label: "SMS", icon: Phone, value: normalizedContact.sms }
      : null,
  ].filter(Boolean) as { method: "telegram" | "whatsapp" | "sms"; label: string; icon: typeof MessageCircle; value: string }[];

  const openContact = (method: "telegram" | "whatsapp" | "sms", value: string) => {
    if (postId) {
      supabase
        .from("post_analytics")
        .insert({ post_id: postId, event_type: "contact_click", contact_method: method })
        .then(({ error }) => {
          if (error && process.env.NODE_ENV === "development") {
            console.warn("Contact click not tracked:", error);
          }
        });
    }

    const message = encodeURIComponent(
      `Hi! I found your ${post.title} on RooVibe and want to place an order.`
    );

    if (method === "telegram") {
      window.open(`https://t.me/${value}?text=${message}`, "_blank");
      return;
    }
    if (method === "whatsapp") {
      window.open(`https://wa.me/${value}?text=${message}`, "_blank");
      return;
    }
    if (method === "sms") {
      window.open(`sms:${value}?body=${message}`, "_self");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* ✅ p-0 + overflow-hidden for the image-flush-to-edge look
          sizing is now controlled by dialog.tsx — consistent everywhere */}
      <DialogContent
        key={post.id}
        className="p-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>

        {/* Image area — flush to edges, close button floats over it */}
        <div className="relative w-full bg-muted">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {imageUrls.length > 0 ? (
            <Swiper
              key={post.id}
              modules={[Navigation, Pagination]}
              navigation={imageUrls.length > 1}
              pagination={imageUrls.length > 1 ? { clickable: true } : false}
              className="w-full"
              onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
            >
              {imageUrls.map((url, idx) => (
                <SwiperSlide key={`${post.id}-${idx}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${post.title} ${idx + 1}`}
                    className={`w-full aspect-[4/4] object-cover object-top block ${post.css_filter || ""}`}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full aspect-[4/5] bg-muted animate-pulse" />
          )}

          {imageUrls.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white z-10">
              {activeImageIndex + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{post.title}</h2>
              {post.price && (
                <p className="text-muted-foreground font-medium">
                  {post.price.toLocaleString()} Tomans
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-xl shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                    {profile?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-bold line-clamp-1">
                  {profile?.display_name || "Unknown Creator"}
                </span>
                {profile?.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {post.story && (
            <p className="text-sm text-foreground leading-relaxed">{post.story}</p>
          )}

          {availableContacts.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Contact creator
              </p>
              <div
                className={`grid gap-2 ${
                  availableContacts.length === 1
                    ? "grid-cols-1"
                    : availableContacts.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                }`}
              >
                {availableContacts.map((contact) => {
                  const Icon = contact.icon;
                  return (
                    <Button
                      key={contact.method}
                      size="sm"
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => openContact(contact.method, contact.value)}
                    >
                      <Icon className="w-4 h-4" />
                      {contact.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}