"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCroppedImg } from "@/utils/cropImage";
import { Upload, Crop, Wand2, Check, Image as ImageIcon } from "lucide-react";

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

type UploadImage = {
  id: string;
  originalFile: File;
  originalSrc: string;
  croppedSrc: string | null;
  croppedBlob: Blob | null;
};

type Tag = {
  id: number;
  name: string;
};

export function ImagePublisher() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0); // 0: Upload, 1: Crop, 2: Filter, 3: Meta
  const [images, setImages] = useState<UploadImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = images[activeImageIndex] || null;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(4 / 5);

  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0].class);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [contactMethods, setContactMethods] = useState({
    sms: false,
    telegram: false,
    whatsapp: false,
  });
  const [contactValues, setContactValues] = useState({
    sms: "",
    telegram: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTags() {
      const { data, error } = await supabase.from("tags").select("id,name").order("name");
      if (error) {
        console.error(error);
        return;
      }
      setTags((data || []) as Tag[]);
    }
    loadTags();
  }, [supabase]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        originalFile: file,
        originalSrc: URL.createObjectURL(file),
        croppedSrc: null,
        croppedBlob: null,
      }));
      setImages(newImages);
      setActiveImageIndex(0);
      setStep(1);
    }
  };

  const onCropComplete = useCallback((_: unknown, croppedPixels: unknown) => {
    setCroppedAreaPixels(croppedPixels as { x: number; y: number; width: number; height: number });
  }, []);

  const handleCropSave = async () => {
    if (!activeImage || !croppedAreaPixels) return;
    const croppedImageBlob = await getCroppedImg(activeImage.originalSrc, croppedAreaPixels);
    if (!croppedImageBlob) return;

    setImages((prev) =>
      prev.map((img, idx) =>
        idx === activeImageIndex
          ? {
              ...img,
              croppedBlob: croppedImageBlob,
              croppedSrc: URL.createObjectURL(croppedImageBlob),
            }
          : img
      )
    );

    setStep(2);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase())
  );

  const toggleContactMethod = (key: "sms" | "telegram" | "whatsapp") => {
    setContactMethods((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const buildContactInfo = () => {
    const payload: Record<string, string> = {};
    if (contactMethods.sms && contactValues.sms.trim()) payload.sms = contactValues.sms.trim();
    if (contactMethods.telegram && contactValues.telegram.trim())
      payload.telegram = contactValues.telegram.trim();
    if (contactMethods.whatsapp && contactValues.whatsapp.trim())
      payload.whatsapp = contactValues.whatsapp.trim();
    return payload;
  };

  const handlePublish = async () => {
    if (!title || images.length === 0) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const imageUploads = await Promise.all(
        images.map(async (image, index) => {
          const uploadBlob = image.croppedBlob || image.originalFile;
          const fileName = `${user.id}-${Date.now()}-${index}.jpg`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("posts")
            .upload(fileName, uploadBlob, {
              contentType: "image/jpeg",
            });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("posts").getPublicUrl(uploadData.path);

          return {
            image_url: publicUrl,
            display_order: index,
          };
        })
      );

      const contactInfo = buildContactInfo();
      const primaryTagId = selectedTagIds[0] ?? null;

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          creator_id: user.id,
          title,
          story,
          price: price ? parseFloat(price) : null,
          css_filter: selectedFilter,
          primary_tag_id: primaryTagId,
          contact_info: Object.keys(contactInfo).length ? contactInfo : null,
        })
        .select()
        .single();

      if (postError) throw postError;

      const { error: postImagesError } = await supabase.from("post_images").insert(
        imageUploads.map((img) => ({
          post_id: postData.id,
          image_url: img.image_url,
          display_order: img.display_order,
        }))
      );
      if (postImagesError) throw postImagesError;

      if (selectedTagIds.length > 0) {
        const { error: postTagsError } = await supabase.from("post_tags").insert(
          selectedTagIds.map((tagId) => ({
            post_id: postData.id,
            tag_id: tagId,
          }))
        );
        if (postTagsError) throw postTagsError;
      }

      router.push("/feed");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error publishing post");
    } finally {
      setLoading(false);
    }
  };

  const activePreviewSrc = activeImage?.croppedSrc || activeImage?.originalSrc || null;

  return (
    <div className="flex flex-col h-full bg-background relative max-w-lg mx-auto w-full border-x">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="font-bold text-lg">
          {step === 0 && "Publish"}
          {step === 1 && "Crop Images"}
          {step === 2 && "Add Filter"}
          {step === 3 && "Details"}
        </h1>
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative">
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <div
              className="w-full aspect-[4/5] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">Select Photos</h3>
              <p className="text-muted-foreground text-sm mt-1">You can upload multiple images</p>
            </div>
          </div>
        )}

        {step === 1 && activeImage && (
          <div className="flex-1 flex flex-col">
            <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.label}
                  variant={selectedAspect === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAspect(ratio.value)}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
            <div className="relative aspect-[4/5] flex-1 bg-black">
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
            <div className="p-4 border-t bg-background space-y-2">
              <p className="text-xs text-muted-foreground">
                Image {activeImageIndex + 1} of {images.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActiveImageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeImageIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setActiveImageIndex((prev) => Math.min(images.length - 1, prev + 1))
                  }
                  disabled={activeImageIndex === images.length - 1}
                >
                  Next
                </Button>
              </div>
              <Button onClick={handleCropSave} className="w-full" size="lg">
                <Crop className="w-4 h-4 mr-2" />
                Save Crop
              </Button>
            </div>
          </div>
        )}

        {step === 2 && activePreviewSrc && (
          <div className="flex-1 flex flex-col">
            <div className="p-4 flex-1 flex items-center justify-center bg-muted/20">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreviewSrc}
                  alt="Cropped Preview"
                  className={`w-full h-full object-cover transition-all ${selectedFilter}`}
                />
              </div>
            </div>

            <div className="p-4 border-t bg-background space-y-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFilter(f.class)}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    <div
                      className={`w-16 h-20 rounded-md overflow-hidden ring-2 ring-offset-2 transition-all ${
                        selectedFilter === f.class ? "ring-primary" : "ring-transparent"
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActiveImageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeImageIndex === 0}
                >
                  Previous Image
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setActiveImageIndex((prev) => Math.min(images.length - 1, prev + 1))
                  }
                  disabled={activeImageIndex === images.length - 1}
                >
                  Next Image
                </Button>
              </div>
              <Button onClick={() => setStep(3)} className="w-full" size="lg">
                <Wand2 className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 p-4 space-y-6">
            <div className="flex gap-4 p-4 rounded-xl border bg-muted/20">
              <div className="w-20 aspect-[4/5] rounded-md overflow-hidden flex-shrink-0">
                {activePreviewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePreviewSrc}
                    alt="Preview"
                    className={`w-full h-full object-cover ${selectedFilter}`}
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex flex-col justify-center gap-1">
                <p className="font-medium flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" /> Ready to Publish
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> {images.length} image(s)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="What are you sharing?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (Tomans)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 250000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story">The Story</Label>
                <Textarea
                  id="story"
                  placeholder="Tell the story behind this piece..."
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  placeholder="Search tags..."
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                />
                <div className="max-h-44 overflow-y-auto rounded-lg border p-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Button>
                    ))}
                    {filteredTags.length === 0 && (
                      <p className="text-xs text-muted-foreground px-1 py-2">
                        No tags match your search.
                      </p>
                    )}
                  </div>
                </div>
                {selectedTagIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTagIds.length} tag(s) selected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contact Methods</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={contactMethods.sms ? "default" : "outline"}
                    onClick={() => toggleContactMethod("sms")}
                  >
                    SMS
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={contactMethods.telegram ? "default" : "outline"}
                    onClick={() => toggleContactMethod("telegram")}
                  >
                    Telegram
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={contactMethods.whatsapp ? "default" : "outline"}
                    onClick={() => toggleContactMethod("whatsapp")}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>

              {contactMethods.sms && (
                <div className="space-y-2">
                  <Label htmlFor="sms">SMS Number</Label>
                  <Input
                    id="sms"
                    placeholder="09xxxxxxxxx"
                    value={contactValues.sms}
                    onChange={(e) =>
                      setContactValues((prev) => ({ ...prev, sms: e.target.value }))
                    }
                  />
                </div>
              )}

              {contactMethods.telegram && (
                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram Username</Label>
                  <Input
                    id="telegram"
                    placeholder="username (without @)"
                    value={contactValues.telegram}
                    onChange={(e) =>
                      setContactValues((prev) => ({ ...prev, telegram: e.target.value }))
                    }
                  />
                </div>
              )}

              {contactMethods.whatsapp && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    placeholder="98xxxxxxxxxx"
                    value={contactValues.whatsapp}
                    onChange={(e) =>
                      setContactValues((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handlePublish}
                className="w-full"
                size="lg"
                disabled={!title || loading}
              >
                {loading ? "Publishing..." : "Publish Post"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
