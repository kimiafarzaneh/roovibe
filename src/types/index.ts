export type Profile = {
  address: string;
  phone: string;
  username: string;
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  telegram_handle: string | null;
  whatsapp_handle: string | null;
  city: string | null;
};

export type Post = {
  id: string;
  creator_id: string;
  image_url?: string | null;
  title: string;
  story: string | null;
  price: number | null;
  css_filter: string | null;
  primary_tag_id: number | null;
  contact_info:
    | {
        sms?: string;
        telegram?: string;
        whatsapp?: string;
      }
    | { type: "sms" | "telegram" | "whatsapp"; value: string }[]
    | null;
  created_at: string;
  profiles?: Profile; // Joined data
  post_tags?: { tags: { name: string } }[]; // Joined data
  post_images?: {
    id: number;
    image_url: string;
    display_order: number | null;
  }[];
};
