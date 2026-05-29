-- Insert mock profiles
INSERT INTO public.profiles (id, display_name, avatar_url, bio, is_creator, telegram_handle, whatsapp_handle, city)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Alice Maker', 'https://i.pravatar.cc/150?u=a042581f4e29026704d', 'Creating handmade ceramics', true, 'alicemaker', '1234567890', 'Tehran'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Bob Vintage', 'https://i.pravatar.cc/150?u=a04258a2462d826712d', 'Curating the best vintage clothes', true, null, '0987654321', 'Shiraz'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Charlie Arts', 'https://i.pravatar.cc/150?u=a042581f4e29026024d', 'Digital artist and illustrator', true, 'charliearts', null, 'Isfahan');

-- Insert mock tags
INSERT INTO public.tags (id, name)
VALUES
  (1, 'Handmade Fashion'),
  (2, 'Local Cafés'),
  (3, 'Cozy Spaces'),
  (4, 'Art'),
  (5, 'Vintage'),
  (6, 'Ceramics'),
  (7, 'Streetwear'),
  (8, 'Street Food')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert mock posts
INSERT INTO public.posts (id, creator_id, image_url, title, story, price)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80', 'Blue Ceramic Mug', 'Hand-painted blue mug perfect for your morning coffee.', 250000),
  ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80', 'White Vase', 'Minimalist white vase for dried flowers.', 450000),
  ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1550614000-4b95d466f120?w=800&q=80', 'Vintage Denim Jacket', 'Classic 90s denim jacket in excellent condition.', 850000),
  ('10000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&q=80', 'Abstract Canvas', 'Original abstract acrylic painting.', 1200000),
  ('10000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1521001561976-a717fb67bce7?w=800&q=80', 'Retro Sunglasses', 'Stylish vintage sunglasses from the 70s.', 350000);

-- Insert mock post_tags
INSERT INTO public.post_tags (post_id, tag_id)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 6),
  ('10000000-0000-0000-0000-000000000002'::uuid, 6),
  ('10000000-0000-0000-0000-000000000003'::uuid, 5),
  ('10000000-0000-0000-0000-000000000003'::uuid, 7),
  ('10000000-0000-0000-0000-000000000004'::uuid, 4),
  ('10000000-0000-0000-0000-000000000005'::uuid, 5);





-- =========================================================================
-- 3. SAFE TAG POPULATION (Only inserts if the name completely doesn't exist)
-- =========================================================================
INSERT INTO public.tags (name)
VALUES
  ('Handmade Fashion'),
  ('Local Cafés'),
  ('Cozy Spaces'),
  ('Art'),
  ('Vintage'),
  ('Ceramics'),
  ('Streetwear'),
  ('Street Food')
ON CONFLICT (name) DO NOTHING;


-- =========================================================================
-- 4. INSERT MOCK POSTS (Utilizing primary_tag_id dynamically from existing tags)
-- =========================================================================
INSERT INTO public.posts (id, creator_id, title, story, price, primary_tag_id, contact_info)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid, 
    '00000000-0000-0000-0000-000000000001'::uuid, 
    'Blue Ceramic Mug', 
    'Hand-painted blue mug perfect for your morning coffee.', 
    250000, 
    (SELECT id FROM public.tags WHERE LOWER(name) = 'ceramics' LIMIT 1),
    '[{"type": "telegram", "value": "alicemaker"}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid, 
    '00000000-0000-0000-0000-000000000001'::uuid, 
    'White Vase', 
    'Minimalist white vase for dried flowers.', 
    450000, 
    (SELECT id FROM public.tags WHERE LOWER(name) = 'ceramics' LIMIT 1),
    '[{"type": "whatsapp", "value": "1234567890"}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid, 
    '00000000-0000-0000-0000-000000000002'::uuid, 
    'Vintage Denim Jacket', 
    'Classic 90s denim jacket in excellent condition.', 
    850000, 
    (SELECT id FROM public.tags WHERE LOWER(name) = 'vintage' LIMIT 1),
    '[]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000004'::uuid, 
    '00000000-0000-0000-0000-000000000003'::uuid, 
    'Abstract Canvas', 
    'Original abstract acrylic painting.', 
    1200000, 
    (SELECT id FROM public.tags WHERE LOWER(name) = 'art' LIMIT 1),
    '[]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000005'::uuid, 
    '00000000-0000-0000-0000-000000000002'::uuid, 
    'Retro Sunglasses', 
    'Stylish vintage sunglasses from the 70s.', 
    350000, 
    (SELECT id FROM public.tags WHERE LOWER(name) = 'vintage' LIMIT 1),
    '[]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- 5. POPULATE THE NEW POST_IMAGES TABLE
-- =========================================================================
INSERT INTO public.post_images (post_id, image_url, display_order)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80', 0),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80', 0),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1550614000-4b95d466f120?w=800&q=80', 0),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&q=80', 0),
  ('10000000-0000-0000-0000-000000000005'::uuid, 'https://images.unsplash.com/photo-1521001561976-a717fb67bce7?w=800&q=80', 0);


-- =========================================================================
-- 6. INSERT MOCK POST_TAGS (Dynamic Tag Lookup to support M2M relationships)
-- =========================================================================
INSERT INTO public.post_tags (post_id, tag_id)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'ceramics' LIMIT 1)),
  ('10000000-0000-0000-0000-000000000002'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'ceramics' LIMIT 1)),
  ('10000000-0000-0000-0000-000000000003'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'vintage' LIMIT 1)),
  ('10000000-0000-0000-0000-000000000003'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'streetwear' LIMIT 1)),
  ('10000000-0000-0000-0000-000000000004'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'art' LIMIT 1)),
  ('10000000-0000-0000-0000-000000000005'::uuid, (SELECT id FROM public.tags WHERE LOWER(name) = 'vintage' LIMIT 1))
ON CONFLICT (post_id, tag_id) DO NOTHING;