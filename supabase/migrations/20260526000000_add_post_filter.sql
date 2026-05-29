-- Migration to add css_filter column to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS css_filter text DEFAULT 'none';



