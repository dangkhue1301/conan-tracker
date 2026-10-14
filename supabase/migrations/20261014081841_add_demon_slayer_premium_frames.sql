-- Add the thirteen requested Demon Slayer frames. Muichiro already exists.
-- Match its authoritative price and gates without changing wallets or inventory.
insert into public.cosmetic_catalog(id,category,price,streak_required,extra_required)
values
  ('frame-giyu','frame',4000,40,0),
  ('frame-tengen','frame',4000,40,0),
  ('frame-nezuko','frame',4000,40,0),
  ('frame-douma','frame',4000,40,0),
  ('frame-muzan','frame',4000,40,0),
  ('frame-sanemi','frame',4000,40,0),
  ('frame-obanai','frame',4000,40,0),
  ('frame-rengoku','frame',4000,40,0),
  ('frame-mitsuri','frame',4000,40,0),
  ('frame-gyomei','frame',4000,40,0),
  ('frame-akaza','frame',4000,40,0),
  ('frame-kokushibo','frame',4000,40,0),
  ('frame-tanjiro','frame',4000,40,0)
on conflict(id) do update set category=excluded.category,price=excluded.price,
  streak_required=excluded.streak_required,extra_required=excluded.extra_required;
