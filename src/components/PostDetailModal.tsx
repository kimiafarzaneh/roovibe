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
import { MapPin, MessageCircle, Phone } from "lucide-react";
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
  const contactInfo = post?.contact_info;


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
        setFetchedImagesState({ postId: postId ?? null, urls });      }
    }
    loadImages();
  }, [postId, isOpen, imageUrls.length, supabase]);

  if (!post) return null;

  const profile = post.profiles;
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

  const openContact = (method: "telegram" | "whatsapp" | "sms") => {
    const message = encodeURIComponent(
      `Hi! I found your ${post.title} on RooVibe and want to place an order.`
    );

    if (method === "telegram" && normalizedContact.telegram) {
      window.open(`https://t.me/${normalizedContact.telegram}?text=${message}`, "_blank");
      return;
    }

    if (method === "whatsapp" && normalizedContact.whatsapp) {
      window.open(`https://wa.me/${normalizedContact.whatsapp}?text=${message}`, "_blank");
      return;
    }

    if (method === "sms" && normalizedContact.sms) {
      window.open(`sms:${normalizedContact.sms}?body=${message}`, "_self");
      return;
    }

    alert("This creator has not provided this contact method.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent key={post.id} className="sm:max-w-[425px] p-0 overflow-hidden bg-background">
        <DialogHeader className="sr-only">
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full aspect-[4/5] bg-muted">
          {imageUrls.length > 0 ? (
            <Swiper
              key={post.id}
              modules={[Navigation, Pagination]}
              navigation={imageUrls.length > 1}
              pagination={imageUrls.length > 1 ? { clickable: true } : false}
              className="h-full w-full"
              onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
            >
              {imageUrls.map((url, idx) => (
                <SwiperSlide key={`${post.id}-${idx}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${post.title} ${idx + 1}`}
                    className={`w-full h-full object-cover ${post.css_filter || ""}`}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white z-10">
              {activeImageIndex + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{post.title}</h2>
              {post.price && (
                <p className="text-muted-foreground font-medium">
                  {post.price.toLocaleString()} Tomans
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                    {profile?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-bold line-clamp-1">{profile?.display_name || "Unknown Creator"}</span>
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
            <p className="text-sm text-foreground leading-relaxed">
              {post.story}
            </p>
          )}

          <div className="pt-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Contact creator
            </p>
            <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1"
              onClick={() => openContact("telegram")}
              disabled={!normalizedContact.telegram}
            >
              <MessageCircle className="w-4 h-4" />
              Telegram
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1"
              onClick={() => openContact("whatsapp")}
              disabled={!normalizedContact.whatsapp}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1"
              onClick={() => openContact("sms")}
              disabled={!normalizedContact.sms}
            >
              <Phone className="w-4 h-4" />
              SMS
            </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
