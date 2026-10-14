-- User-requested original reference frame. Existing balances/inventory/history stay intact.
insert into public.cosmetic_catalog(id,category,price,streak_required,extra_required)
values('frame-mist-swordsman','frame',4000,40,0)
on conflict(id) do update set category=excluded.category,price=excluded.price,
  streak_required=excluded.streak_required,extra_required=excluded.extra_required;

-- Retire the standalone weapons category. Historical ownership records stay intact.
delete from public.cosmetic_catalog where category='weapon';
