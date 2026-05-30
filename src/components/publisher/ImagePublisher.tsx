"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cropper from "react-easy-crop";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCroppedImg } from "@/utils/cropImage";
import {
  Upload, Crop, Wand2, Check, Image as ImageIcon,
  X, ChevronLeft, ChevronRight, ChevronDown, Search,
} from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  title: z.string().min(3, "At least 3 characters").max(80, "Max 80 characters"),
  price: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), "Must be a positive number"),
  story: z.string().max(500, "Max 500 characters").optional(),
  sms: z
    .string().optional()
    .refine((v) => !v || /^[0-9+]{10,15}$/.test(v), "Invalid phone number"),
  telegram: z
    .string().optional()
    .refine((v) => !v || /^[a-zA-Z0-9_]{3,32}$/.test(v), "Invalid username (no @)"),
  whatsapp: z
    .string().optional()
    .refine((v) => !v || /^[0-9+]{10,15}$/.test(v), "Invalid WhatsApp number"),
}).refine((d) => d.sms || d.telegram || d.whatsapp, {
  message: "Provide at least one contact method",
  path: ["sms"],
});

type DetailsForm = z.infer<typeof detailsSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { name: "Normal", class: "" },
  { name: "Vivid", class: "contrast-125 saturate-150" },
  { name: "Faded", class: "contrast-75 sepia-50" },
  { name: "Noir", class: "grayscale contrast-150" },
  { name: "Warm", class: "sepia-50 saturate-150 hue-rotate-[-15deg]" },
  { name: "Cool", class: "saturate-150 hue-rotate-[15deg]" },
];

const ASPECT_RATIOS = [
  { label: "Original", value: undefined as number | undefined },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadImage = {
  id: string;
  originalFile: File;
  originalSrc: string;
  croppedSrc: string | null;
  croppedBlob: Blob | null;
  filter: string;
};

type Tag = { id: number; name: string };

// ─── Tags Dropdown ────────────────────────────────────────────────────────────

function TagsDropdown({
  tags,
  selectedIds,
  onToggle,
}: {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );
  const selectedNames = tags
    .filter((t) => selectedIds.includes(t.id))
    .map((t) => t.name);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="text-left truncate">
          {selectedNames.length === 0
            ? "Select tags..."
            : selectedNames.join(", ")}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
          {/* Search inside dropdown */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search tags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 rounded-md outline-none"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">No tags found</p>
            ) : (
              filtered.map((tag) => {
                const selected = selectedIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggle(tag.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      selected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {tag.name}
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Selected count footer */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-2 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {selectedIds.length} selected
                <button
                  type="button"
                  className="ml-2 text-destructive hover:underline"
                  onClick={() => selectedIds.forEach(onToggle)}
                >
                  Clear all
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ImagePublisher() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ✅ Separate ref for the "add more" input — accepts additional files
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = images[activeIdx] ?? null;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(4 / 5);

  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { title: "", price: "", story: "", sms: "", telegram: "", whatsapp: "" },
  });

  useEffect(() => {
    supabase.from("tags").select("id,name").order("name")
      .then(({ data }) => setTags((data || []) as Tag[]));
  }, []);

  // ─── File handlers ──────────────────────────────────────────────────────

  const filesToImages = (files: File[]): UploadImage[] =>
    files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      originalFile: file,
      originalSrc: URL.createObjectURL(file),
      croppedSrc: null,
      croppedBlob: null,
      filter: "",
    }));

  // Initial selection — replaces everything
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const newImages = filesToImages(Array.from(e.target.files));
    setImages(newImages);
    setActiveIdx(0);
    resetCropState();
    setStep(1);
    e.target.value = ""; // reset so same file can be re-selected
  };

  // ✅ Add more images — APPENDS to existing, does not replace
  const onAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const newImages = filesToImages(Array.from(e.target.files));
    setImages((prev) => [...prev, ...newImages]);
    // Jump to first new image
    setActiveIdx((prev) => prev); // stay on current
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length === 0) { setStep(0); return next; }
      setActiveIdx((i) => Math.min(i, next.length - 1));
      return next;
    });
  };

  // ─── Crop ────────────────────────────────────────────────────────────────

  const resetCropState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const switchToImage = (idx: number) => {
    setActiveIdx(idx);
    resetCropState();
  };

  const onCropComplete = useCallback((_: unknown, pixels: unknown) => {
    setCroppedAreaPixels(pixels as { x: number; y: number; width: number; height: number });
  }, []);

  // Crop the current image and stay on crop step
  const cropCurrent = async () => {
    if (!activeImage || !croppedAreaPixels) return;
    const blob = await getCroppedImg(activeImage.originalSrc, croppedAreaPixels);
    if (!blob) return;
    setImages((prev) =>
      prev.map((img, i) =>
        i === activeIdx
          ? { ...img, croppedBlob: blob, croppedSrc: URL.createObjectURL(blob) }
          : img
      )
    );
  };

  // Crop current then advance to next uncropped, or go to filter step
  const cropAndAdvance = async () => {
    await cropCurrent();
    const nextUncropped = images.findIndex((img, i) => i !== activeIdx && !img.croppedSrc);
    if (nextUncropped !== -1) {
      switchToImage(nextUncropped);
    } else {
      setStep(2);
    }
  };

  // ─── Filter ──────────────────────────────────────────────────────────────

  const setFilterForActive = (cls: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === activeIdx ? { ...img, filter: cls } : img))
    );
  };

  // ─── Publish ─────────────────────────────────────────────────────────────

  const onSubmit = async (formData: DetailsForm) => {
    if (images.length === 0) return;
    setLoading(true);
    setPublishError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const imageUploads = await Promise.all(
        images.map(async (image, index) => {
          const blob = image.croppedBlob || image.originalFile;
          const fileName = `${user.id}-${Date.now()}-${index}.jpg`;
          const { data: uploadData, error } = await supabase.storage
            .from("posts").upload(fileName, blob, { contentType: "image/jpeg" });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(uploadData.path);
          return { image_url: publicUrl, display_order: index, filter: image.filter };
        })
      );

      const contactInfo: Record<string, string> = {};
      if (formData.sms?.trim()) contactInfo.sms = formData.sms.trim();
      if (formData.telegram?.trim()) contactInfo.telegram = formData.telegram.trim();
      if (formData.whatsapp?.trim()) contactInfo.whatsapp = formData.whatsapp.trim();

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          creator_id: user.id,
          title: formData.title,
          story: formData.story || null,
          price: formData.price ? parseFloat(formData.price) : null,
          css_filter: imageUploads[0]?.filter || "",
          primary_tag_id: selectedTagIds[0] ?? null,
          contact_info: Object.keys(contactInfo).length ? contactInfo : null,
        })
        .select().single();
      if (postError) throw postError;

      const { error: imagesError } = await supabase.from("post_images").insert(
        imageUploads.map((img) => ({
          post_id: postData.id, image_url: img.image_url, display_order: img.display_order,
        }))
      );
      if (imagesError) throw imagesError;

      if (selectedTagIds.length > 0) {
        const { error: tagsError } = await supabase.from("post_tags").insert(
          selectedTagIds.map((tagId) => ({ post_id: postData.id, tag_id: tagId }))
        );
        if (tagsError) throw tagsError;
      }

      router.push("/feed");
      router.refresh();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Publishing failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const activePreviewSrc = activeImage?.croppedSrc || activeImage?.originalSrc || null;
  const croppedCount = images.filter((img) => img.croppedSrc).length;
  const stepLabel = ["Publish", "Crop", "Filter", "Details"][step];

  // ─── Thumbnail strip (shared between crop + filter steps) ─────────────────

  const ThumbnailStrip = () => (
    <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-t">
      {images.map((img, i) => (
        <div key={img.id} className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.croppedSrc || img.originalSrc}
            alt={`Image ${i + 1}`}
            onClick={() => switchToImage(i)}
            className={`w-14 h-14 object-cover rounded-xl cursor-pointer ring-2 ring-offset-1 transition-all ${
              i === activeIdx ? "ring-primary scale-105" : "ring-transparent opacity-50"
            } ${img.filter}`}
          />
          {/* Green tick = already cropped */}
          {img.croppedSrc && (
            <div className="absolute bottom-0.5 right-0.5 bg-green-500 rounded-full p-0.5 pointer-events-none">
              <Check className="w-2 h-2 text-white" />
            </div>
          )}
          {/* Remove */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
            className="absolute -top-1.5 -right-1.5 bg-destructive rounded-full p-0.5"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      ))}

      {/* ✅ Add more — uses separate input ref that APPENDS */}
      <button
        type="button"
        onClick={() => addMoreInputRef.current?.click()}
        className="w-14 h-14 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Upload className="w-4 h-4" />
      </button>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background max-w-lg mx-auto w-full border-x">

      {/* Hidden inputs */}
      <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={onFileChange} className="hidden" />
      <input type="file" accept="image/*" multiple ref={addMoreInputRef} onChange={onAddMore} className="hidden" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b shrink-0">
        <h1 className="font-bold text-lg">{stepLabel}</h1>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2 | 3)}>
              Back
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

        {/* ── Step 0: Upload ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div
              className="w-full aspect-[4/5] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">Select Photos</h3>
              <p className="text-muted-foreground text-sm mt-1">Tap to select one or more images</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Crop ──────────────────────────────────────────────── */}
        {step === 1 && activeImage && (
          <div className="flex-1 flex flex-col min-h-0">

            {/* Aspect ratio pills */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto shrink-0">
              {ASPECT_RATIOS.map((r) => (
                <Button
                  key={r.label}
                  variant={selectedAspect === r.value ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedAspect(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>

            {/* Cropper canvas */}
            <div className="relative aspect-square bg-black mx-4 rounded-2xl overflow-hidden shrink-0">
              <Cropper
                image={activeImage.originalSrc}
                crop={crop}
                zoom={zoom}
                aspect={selectedAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Progress hint */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {croppedCount}/{images.length} cropped
              {croppedCount < images.length && " — tap thumbnails to switch"}
            </p>

            {/* Thumbnail strip with add-more button */}
            <ThumbnailStrip />

            {/* Actions */}
            <div className="p-4 space-y-2 shrink-0">
              {/* ✅ No more Next/Previous buttons — thumbnails handle switching */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1" onClick={cropCurrent}>
                  <Crop className="w-4 h-4" /> Crop this image
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => {
                    // Skip crop for this image and move to next uncropped
                    const nextUncropped = images.findIndex((img, i) => i !== activeIdx && !img.croppedSrc);
                    if (nextUncropped !== -1) switchToImage(nextUncropped);
                  }}
                  disabled={images.every((img, i) => i === activeIdx || !!img.croppedSrc)}
                >
                  Skip this
                </Button>
              </div>
              <Button onClick={cropAndAdvance} className="w-full" size="lg">
                <Crop className="w-4 h-4 mr-2" />
                {croppedCount < images.length
                  ? `Crop & next (${images.length - croppedCount - 1} remaining)`
                  : "Done — go to filters →"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Filter ────────────────────────────────────────────── */}
        {step === 2 && activePreviewSrc && (
          <div className="flex-1 flex flex-col min-h-0">

            {/* Image preview */}
            <div className="flex-1 flex items-center justify-center p-4 bg-muted/10 min-h-0">
              <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreviewSrc}
                  alt="Preview"
                  className={`w-full h-auto block transition-all ${activeImage?.filter || ""}`}
                />
              </div>
            </div>

            {/* Thumbnail strip */}
            <ThumbnailStrip />

            {/* Filter strip */}
            <div className="px-4 pt-3 shrink-0">
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFilterForActive(f.class)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl overflow-hidden ring-2 ring-offset-2 transition-all ${
                        activeImage?.filter === f.class ? "ring-primary" : "ring-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePreviewSrc}
                        alt={f.name}
                        className={`w-full h-full object-cover ${f.class}`}
                      />
                    </div>
                    <span className="text-xs font-medium">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 shrink-0">
              <Button onClick={() => setStep(3)} className="w-full" size="lg">
                <Wand2 className="w-4 h-4 mr-2" /> Next — Add details
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Details ───────────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-5 pb-8">

            {/* Mini image strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.croppedSrc || img.originalSrc}
                  alt="preview"
                  className={`w-16 h-20 object-cover rounded-xl shrink-0 ${img.filter}`}
                />
              ))}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" placeholder="What are you sharing?" {...register("title")} aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (Tomans)</Label>
              <Input id="price" type="number" min="0" placeholder="e.g. 250000" {...register("price")} aria-invalid={!!errors.price} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            {/* Story */}
            <div className="space-y-1.5">
              <Label htmlFor="story">
                Story
                <span className="text-muted-foreground font-normal ml-1">({watch("story")?.length ?? 0}/500)</span>
              </Label>
              <Textarea id="story" placeholder="Tell the story behind this piece..." rows={3} {...register("story")} aria-invalid={!!errors.story} />
              {errors.story && <p className="text-xs text-destructive">{errors.story.message}</p>}
            </div>

            {/* ✅ Tags — dropdown combobox */}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagsDropdown
                tags={tags}
                selectedIds={selectedTagIds}
                onToggle={(id) =>
                  setSelectedTagIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
              />
            </div>

            {/* Contact methods */}
            <div className="space-y-3">
              <div>
                <Label>Contact Methods</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Fill at least one so buyers can reach you</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sms" className="text-sm font-normal">SMS / Phone</Label>
                <Input id="sms" type="tel" placeholder="09xxxxxxxxx" {...register("sms")} aria-invalid={!!errors.sms} />
                {errors.sms && <p className="text-xs text-destructive">{errors.sms.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telegram" className="text-sm font-normal">Telegram Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input id="telegram" placeholder="username" className="pl-7" {...register("telegram")} aria-invalid={!!errors.telegram} />
                </div>
                {errors.telegram && <p className="text-xs text-destructive">{errors.telegram.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-sm font-normal">WhatsApp Number</Label>
                <Input id="whatsapp" type="tel" placeholder="98xxxxxxxxxx" {...register("whatsapp")} aria-invalid={!!errors.whatsapp} />
                {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
              </div>
            </div>

            {publishError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{publishError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 animate-pulse" /> Publishing...</span>
                : <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Publish Post</span>
              }
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}