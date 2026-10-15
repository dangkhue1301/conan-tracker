-- Add the nine supplied Basic frames as separate SKUs from their Premium editions.
-- The user's corrected gate is 1,800 Coin and a 14-day best streak; no extra-work gate.
insert into public.cosmetic_catalog(id,category,price,streak_required,extra_required)
values
  ('frame-demon-slayer-basic-douma','frame',1800,14,0),
  ('frame-demon-slayer-basic-sanemi','frame',1800,14,0),
  ('frame-demon-slayer-basic-obanai','frame',1800,14,0),
  ('frame-demon-slayer-basic-giyu','frame',1800,14,0),
  ('frame-demon-slayer-basic-gyomei','frame',1800,14,0),
  ('frame-demon-slayer-basic-tanjiro','frame',1800,14,0),
  ('frame-demon-slayer-basic-muichiro','frame',1800,14,0),
  ('frame-demon-slayer-basic-kokushibo','frame',1800,14,0),
  ('frame-demon-slayer-basic-mitsuri','frame',1800,14,0)
on conflict(id) do update set category=excluded.category,price=excluded.price,
  streak_required=excluded.streak_required,extra_required=excluded.extra_required;
