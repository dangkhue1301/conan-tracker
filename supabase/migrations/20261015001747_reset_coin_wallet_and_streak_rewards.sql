-- Reset Conan's shop purchases and start a new 200-Coin wallet once.
-- Keep all learning history, XP, streaks, avatar, gifts and league results.
-- The reset day's existing work is a baseline; older daily earnings are excluded.
create or replace function conan_private.streak_coin_rewards(p_best integer)
returns table(days integer, coins integer)
language sql immutable set search_path='' as $$
  select milestone,case when milestone in (7,10) then 100
    when milestone in (30,60,90) then 150 else 300 end
  from (
    select unnest(array[7,10,30,60,90,120,180,365]) milestone
    union all select generate_series(400,p_best,100)
  ) thresholds where milestone<=p_best order by milestone;
$$;

create or replace function conan_private.coin_totals()
returns table(earned_coins bigint, streak_coins bigint, coins bigint)
language sql stable set search_path='' as $$
  with wallet as (
    select coalesce(data->'coinWallet','{}'::jsonb) value,
      coalesce((data->>'spentCoins')::bigint,0) spent
    from public.game_state where id=1
  ), daily as (
    select d.*,case
      when d.day<(w.value->>'startedOn')::date then 0
      when d.day=(w.value->>'startedOn')::date then
        (select coalesce(sum(greatest(0,
          case c.status when 'minimum' then 5 when 'done' then 10 when 'extra' then 15 else 0 end
          -coalesce((w.value->'baselineByHabit'->>c.habit_id)::integer,0))),0)
        from public.checkins c
        join lateral(select phase,habits from public.plan_versions
          where effective_from<=d.day order by effective_from desc limit 1) p on true
        where c.date=d.day and not d.rest and exists (
          select 1 from jsonb_array_elements(p.habits) h
          where h->>'id'=c.habit_id and (h->>'id'<>'review' or p.phase>=3)
            and (h->>'id'<>'writing' or p.phase>=2)
        ))+case when not d.rest and d.required>0 and d.credited=d.required
          then greatest(0,10-coalesce((w.value->>'dayBonusBaseline')::integer,0)) else 0 end
      else d.coins end earned
    from conan_private.day_stats(public.app_today()) d cross join wallet w
  ), totals as (
    select coalesce((select sum(earned) from daily),0)::bigint work,
      coalesce((select sum(r.coins) from conan_private.streak_coin_rewards(conan_private.best_streak()) r
        where r.days>coalesce((w.value->>'streakBaseline')::integer,0)),0)::bigint bonus,
      coalesce((w.value->>'openingCoins')::bigint,200) opening,w.spent
    from wallet w
  )
  select work+bonus,bonus,greatest(0,opening+work+bonus-spent) from totals;
$$;
revoke all on function conan_private.streak_coin_rewards(integer),conan_private.coin_totals()
  from public,anon,authenticated;

-- The singleton profile/game row is Conan. A guard makes retries preserve later purchases.
do $$ begin
perform 1 from public.game_state where id=1 for update;
update public.game_state g set data=g.data||jsonb_build_object(
  'inventory',jsonb_build_array('frame-starter'),
  'equipped','{}'::jsonb,
  'spentCoins',0,
  'coinWallet',jsonb_build_object(
    'openingCoins',200,
    'startedOn',public.app_today(),
    'baselineByHabit',coalesce((select jsonb_object_agg(c.habit_id,
      case c.status when 'minimum' then 5 when 'done' then 10 when 'extra' then 15 else 0 end)
      from public.checkins c where c.date=public.app_today()
        and not exists(select 1 from public.excused_days e where e.date=c.date)),'{}'::jsonb),
    'dayBonusBaseline',coalesce((select case when not rest and required>0 and credited=required
      then 10 else 0 end from conan_private.day_stats(public.app_today())
      where day=public.app_today()),0),
    'streakBaseline',conan_private.best_streak()
  )
),updated_at=now() where g.id=1 and not (g.data ? 'coinWallet');
end; $$;


-- Purchases use the same reset and streak accounting as the frontend.
create or replace function public.game_action(p_action jsonb) returns void language plpgsql security definer set search_path='' as $$
declare kind text:=p_action->>'type'; g jsonb; changed jsonb; item public.cosmetic_catalog%rowtype; identifier text;
  role text; amount bigint; extra_count bigint; row jsonb; d date; month text; title text; found boolean:=false;
  entry jsonb; rows jsonb; status text; ids jsonb; item_category text; approved boolean; path text;
begin
  perform public.require_app_role(array['learner','mentor','parent']); role:=public.app_role();
  if jsonb_typeof(p_action) is distinct from 'object' then raise exception 'Thao tác không hợp lệ.'; end if;
  select data into g from public.game_state where id=1 for update;
  if kind in ('buy','equip','avatar','repair-request','prize-request','league-join') and role='parent' then raise exception 'Conan hoặc người hướng dẫn thực hiện thao tác này.' using errcode='42501'; end if;
  if kind='repair-review' and role<>'mentor' then raise exception 'Chỉ anh Khuê được duyệt khôi phục streak.' using errcode='42501'; end if;
  if kind in ('prize-save','prize-review') and role='learner' then raise exception 'Ba mẹ hoặc người hướng dẫn duyệt quà tháng.' using errcode='42501'; end if;
  if kind='buy' then
    identifier:=p_action->>'itemId'; select * into item from public.cosmetic_catalog where id=identifier;
    if item.id is null then raise exception 'Vật phẩm không tồn tại.'; end if;
    if (g->'inventory') ? identifier then return; end if;
    select coins into amount from conan_private.coin_totals();
    select coalesce(sum(extras),0) into extra_count from conan_private.day_stats(public.app_today());
    if conan_private.best_streak()<item.streak_required or extra_count<item.extra_required then raise exception 'Em chưa đủ điều kiện mở vật phẩm này.'; end if;
    if amount<item.price then raise exception 'Em chưa đủ Coin.'; end if;
    g:=jsonb_set(jsonb_set(g,'{spentCoins}',to_jsonb((g->>'spentCoins')::bigint+item.price)),'{inventory}',(g->'inventory')||jsonb_build_array(identifier));
  elsif kind='equip' then
    identifier:=p_action->>'itemId'; item_category:=p_action->>'category';
    if item_category is null or item_category not in ('frame','banner','title','celebration','pet','weapon') then raise exception 'Loại vật phẩm không hợp lệ.'; end if;
    if identifier is null then g:=jsonb_set(g,'{equipped}',(g->'equipped')-item_category);
    else
      if not (g->'inventory') ? identifier or not exists(select 1 from public.cosmetic_catalog where id=identifier and cosmetic_catalog.category=item_category) then raise exception 'Em chưa sở hữu vật phẩm phù hợp.'; end if;
      g:=jsonb_set(g,array['equipped',item_category],to_jsonb(identifier));
    end if;
  elsif kind='avatar' then
    path:=p_action->>'path';
    if path is not null and (path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$' or split_part(path,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='avatar-assets' and name=path)) then raise exception 'Ảnh đại diện chưa được tải lên bởi tài khoản này.'; end if;
    g:=jsonb_set(g,'{avatarPath}',coalesce(to_jsonb(path),'null'::jsonb));
  elsif kind in ('seen','read') then
    ids:=case kind when 'seen' then p_action->'keys' else p_action->'ids' end;
    if jsonb_typeof(ids) is distinct from 'array' or jsonb_array_length(ids)>200 then raise exception 'Danh sách đã xem không hợp lệ.'; end if;
    if exists(select 1 from jsonb_array_elements(ids) value where jsonb_typeof(value)<>'string' or length(value#>>'{}')>150) then raise exception 'Mã đã xem không hợp lệ.'; end if;
    if kind='read' then select coalesce(jsonb_agg(e.id::text),'[]'::jsonb) into ids from public.encouragements e where ids ? e.id::text; end if;
    insert into public.game_receipts(user_id) values(auth.uid()) on conflict do nothing;
    if kind='seen' then update public.game_receipts set seen_milestones=(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(seen_milestones||ids) v) where user_id=auth.uid();
    else update public.game_receipts set read_message_ids=(select coalesce(jsonb_agg(distinct v),'[]'::jsonb) from jsonb_array_elements(read_message_ids||ids) v) where user_id=auth.uid(); end if;
    return;
  elsif kind='repair-request' then
    d:=(p_action->>'date')::date;
    if d is null or d>=public.app_today() or d<public.app_today()-7 or not exists(select 1 from conan_private.day_stats(public.app_today()) where day=d and required>0 and credited<required and not rest) then raise exception 'Chỉ xin khôi phục ngày bị lỡ trong 7 ngày gần nhất.'; end if;
    if length(trim(coalesce(p_action->>'reason',''))) not between 1 and 500 or length(trim(coalesce(p_action->>'prevention',''))) not between 1 and 500 then raise exception 'Ghi lý do và cách tránh quên, tối đa 500 ký tự mỗi mục.'; end if;
    if exists(select 1 from jsonb_array_elements(g->'repairs') r where left(r->>'date',7)=left(d::text,7) and r->>'status'<>'rejected') then raise exception 'Tháng này đã có một lượt khôi phục hoặc đang chờ duyệt.'; end if;
    g:=jsonb_set(g,'{repairs}',(g->'repairs')||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'date',d,'reason',trim(p_action->>'reason'),'prevention',trim(p_action->>'prevention'),'status','pending','createdAt',now())));
  elsif kind='repair-review' then
    identifier:=p_action->>'id'; approved:=(p_action->>'approve')::boolean;
    if approved is null then raise exception 'Cần chọn duyệt hoặc từ chối.'; end if;
    select r into row from jsonb_array_elements(g->'repairs') r where r->>'id'=identifier and r->>'status'='pending';
    if row is null then raise exception 'Yêu cầu không còn chờ duyệt.'; end if;
    if approved and exists(select 1 from jsonb_array_elements(g->'repairs') r where r->>'id'<>identifier and left(r->>'date',7)=left(row->>'date',7) and r->>'status'='approved') then raise exception 'Tháng này đã dùng lượt khôi phục.'; end if;
    select jsonb_agg(case when r->>'id'=identifier then jsonb_set(r,'{status}',to_jsonb(case when approved then 'approved' else 'rejected' end)) else r end) into rows from jsonb_array_elements(g->'repairs') r;
    g:=jsonb_set(g,'{repairs}',rows);
  elsif kind='prize-save' then
    row:=p_action->'prize'; identifier:=row->>'id'; title:=trim(row->>'title');
    if identifier is null or length(identifier) not between 1 and 100 or title is null or length(title) not between 1 and 100 or jsonb_typeof(row->'description') is distinct from 'string' or length(row->>'description')>500 or jsonb_typeof(row->'active') is distinct from 'boolean' then raise exception 'Thông tin quà chưa hợp lệ.'; end if;
    if jsonb_array_length(g->'prizeCatalog')>=100 and not exists(select 1 from jsonb_array_elements(g->'prizeCatalog') r where r->>'id'=identifier) then raise exception 'Giữ tối đa 100 món quà.'; end if;
    select coalesce(jsonb_agg(r),'[]'::jsonb) into rows from jsonb_array_elements(g->'prizeCatalog') r where r->>'id'<>identifier;
    g:=jsonb_set(g,'{prizeCatalog}',rows||jsonb_build_array(jsonb_build_object('id',identifier,'title',title,'description',row->>'description','active',(row->>'active')::boolean)));
  elsif kind='prize-request' then
    month:=p_action->>'month'; title:=trim(p_action->>'title');
    if not conan_private.month_eligible(month) then raise exception 'Tháng này chưa đủ điều kiện nhận quà.'; end if;
    if title is null or length(title) not between 1 and 150 then raise exception 'Tên món quà cần từ 1 đến 150 ký tự.'; end if;
    if exists(select 1 from jsonb_array_elements(g->'prizeRequests') r where r->>'month'=month and r->>'status'<>'rejected') then raise exception 'Tháng này đã có yêu cầu quà.'; end if;
    g:=jsonb_set(g,'{prizeRequests}',(g->'prizeRequests')||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'month',month,'title',title,'status','pending','createdAt',now())));
  elsif kind='prize-review' then
    identifier:=p_action->>'id'; status:=p_action->>'status';
    select r into row from jsonb_array_elements(g->'prizeRequests') r where r->>'id'=identifier;
    if row is null or status is null or not ((row->>'status'='pending' and status in ('approved','rejected')) or (row->>'status'='approved' and status='delivered')) then raise exception 'Trạng thái quà không hợp lệ.'; end if;
    if status='approved' and not conan_private.month_eligible(row->>'month') then raise exception 'Tiến độ tháng đã thay đổi, chưa đủ điều kiện.'; end if;
    select jsonb_agg(case when r->>'id'=identifier then jsonb_set(r,'{status}',to_jsonb(status)) else r end) into rows from jsonb_array_elements(g->'prizeRequests') r;
    g:=jsonb_set(g,'{prizeRequests}',rows);
  elsif kind='league-join' then
    perform conan_private.settle_league();
    select data into g from public.game_state where id=1;
    g:=jsonb_set(g,'{league,joinedWeek}',to_jsonb(date_trunc('week',public.app_today())::date::text));
  else raise exception 'Thao tác không hợp lệ.';
  end if;
  update public.game_state set data=g,updated_at=now() where id=1;
end; $$;
