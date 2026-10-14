-- Add the eight user-requested Blue Lock Premium frames with the same gates as Demon Slayer.
-- Sample frames stay retired; saved ownership and Coin/XP are not modified.
insert into public.cosmetic_catalog(id,category,price,streak_required,extra_required)
values
  ('frame-blue-lock-kunigami','frame',4000,40,0),
  ('frame-blue-lock-aiku','frame',4000,40,0),
  ('frame-blue-lock-chigiri','frame',4000,40,0),
  ('frame-blue-lock-nagi','frame',4000,40,0),
  ('frame-blue-lock-rin','frame',4000,40,0),
  ('frame-blue-lock-bachira','frame',4000,40,0),
  ('frame-blue-lock-isagi','frame',4000,40,0),
  ('frame-blue-lock-sae','frame',4000,40,0)
on conflict(id) do update set category=excluded.category,price=excluded.price,
  streak_required=excluded.streak_required,extra_required=excluded.extra_required;

