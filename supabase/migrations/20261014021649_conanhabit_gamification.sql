-- ConanHabit: authoritative wallet, inventory, streak repairs, leagues and monthly gifts.
-- Private helpers are never exposed through PostgREST. Client writes only use validated RPCs.
create schema if not exists conan_private;
revoke all on schema conan_private from public,anon,authenticated;

create table public.game_state (
  id integer primary key check(id=1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.game_state values(1,'{"avatarPath":null,"inventory":["frame-starter"],"equipped":{"frame":"frame-starter"},"spentCoins":0,"repairs":[],"prizeCatalog":[],"prizeRequests":[],"league":{"tier":0,"joinedWeek":null,"history":[]}}',now());
create table public.game_receipts (
  user_id uuid primary key,
  seen_milestones jsonb not null default '[]',
  read_message_ids jsonb not null default '[]'
);
create table public.cosmetic_catalog (
  id text primary key,
  category text not null check(category in ('frame','banner','title','celebration','pet','weapon')),
  price integer not null check(price>=0),
  streak_required integer not null check(streak_required>=0),
  extra_required integer not null check(extra_required>=0)
);
alter table public.game_state enable row level security;
alter table public.game_receipts enable row level security;
alter table public.cosmetic_catalog enable row level security;
revoke all on public.game_state,public.game_receipts,public.cosmetic_catalog from anon,authenticated;
grant select on public.game_state,public.game_receipts,public.cosmetic_catalog to authenticated;
create policy approved_read on public.game_state for select to authenticated using (public.app_role() is not null);
create policy own_read on public.game_receipts for select to authenticated using (public.app_role() is not null and user_id=(select auth.uid()));
create policy approved_read on public.cosmetic_catalog for select to authenticated using (public.app_role() is not null);

-- A shared lock also serializes check-in edits/rest changes with purchases, so undoing
-- work cannot race a purchase into spending the same earnings twice.
create function conan_private.lock_game() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.game_state where id=1 for update;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
create trigger lock_game_checkins before insert or update or delete on public.checkins for each row execute function conan_private.lock_game();
create trigger lock_game_excuses before insert or update or delete on public.excused_days for each row execute function conan_private.lock_game();
create trigger lock_game_plans before insert or update or delete on public.plan_versions for each row execute function conan_private.lock_game();
create trigger lock_game_profile before insert or update or delete on public.profiles for each row execute function conan_private.lock_game();

create function conan_private.day_stats(p_end date)
returns table(day date,required bigint,credited bigint,coins bigint,xp bigint,extras bigint,rest boolean,repaired boolean)
language sql stable set search_path='' as $$
  with days as (
    select s::date as day from public.profiles p,
      lateral generate_series((p.data->>'startedOn')::date::timestamp,p_end::timestamp,interval '1 day') s
    where p.id=1
  ), actual as (
    select d.day,count(h.habit) required,
      count(c.habit_id) filter(where c.status in ('minimum','done','extra')) credited,
      coalesce(sum(case c.status when 'minimum' then 5 when 'done' then 10 when 'extra' then 15 else 0 end),0) coins,
      count(c.habit_id) filter(where c.status='extra') extras,
      exists(select 1 from public.excused_days e where e.date=d.day) rest,
      exists(select 1 from public.game_state g,jsonb_array_elements(g.data->'repairs') r where g.id=1 and r->>'date'=d.day::text and r->>'status'='approved') repaired
    from days d
    left join lateral(select phase,habits from public.plan_versions where effective_from<=d.day order by effective_from desc limit 1) p on true
    left join lateral(select value habit from jsonb_array_elements(p.habits) where (value->>'id'<>'review' or p.phase>=3) and (value->>'id'<>'writing' or p.phase>=2)) h on true
    left join public.checkins c on c.date=d.day and c.habit_id=h.habit->>'id'
    group by d.day
  )
  select a.day,a.required,a.credited,
    case when rest then 0 else coins+case when required>0 and credited=required then 10 else 0 end end,
    case when rest then 0 else 2*(coins+case when required>0 and credited=required then 10 else 0 end) end,
    case when rest then 0 else extras end,rest,repaired
  from actual a order by a.day;
$$;

create function conan_private.best_streak() returns integer language plpgsql stable set search_path='' as $$
declare r record; current_count integer:=0; best integer:=0;
begin
  for r in select * from conan_private.day_stats(public.app_today()) loop
    if r.rest or r.required=0 then continue; end if;
    if r.credited=r.required then current_count:=current_count+1; best:=greatest(best,current_count);
    elsif not r.repaired then current_count:=0;
    end if;
  end loop;
  return best;
end; $$;

create function conan_private.month_eligible(p_month text) returns boolean language plpgsql stable set search_path='' as $$
declare first_day date; last_day date;
begin
  if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then return false; end if;
  first_day:=(p_month||'-01')::date; last_day:=(first_day+interval '1 month'-interval '1 day')::date;
  if last_day>=public.app_today() or not exists(select 1 from public.profiles where id=1 and (data->>'startedOn')::date<=first_day) then return false; end if;
  return (select count(*)=extract(day from last_day)::integer and bool_and(rest or repaired or (required>0 and credited=required))
    from conan_private.day_stats(last_day) where day>=first_day);
end; $$;

create function conan_private.bot_xp(p_week text,p_tier integer,p_index integer) returns integer language plpgsql immutable set search_path='' as $$
declare seed bigint:=7; value text:=p_week||':'||p_tier||':'||p_index; raw integer; i integer;
begin
  for i in 1..length(value) loop seed:=(seed*31+ascii(substr(value,i,1)))%2147483647; end loop;
  raw:=case when p_index<3 then 1350+seed%201 when p_index<7 then 980+seed%201 when p_index<14 then 700+seed%351 when p_index<23 then 350+seed%451 else 100+seed%351 end;
  return (raw::bigint*(765+p_tier*15)/900)::integer;
end; $$;

create function conan_private.settle_league() returns void language plpgsql set search_path='' as $$
declare g jsonb; league jsonb; joined date; current_week date:=date_trunc('week',public.app_today())::date;
  tier integer; amount integer; placement integer; slots integer; outcome text; history jsonb;
begin
  select data into g from public.game_state where id=1 for update;
  league:=g->'league'; joined:=(league->>'joinedWeek')::date;
  if joined is null or joined>=current_week then return; end if;
  history:=league->'history'; tier:=(league->>'tier')::integer;
  if not exists(select 1 from jsonb_array_elements(history) r where r->>'week'=joined::text) then
    select coalesce(sum(xp),0)::integer into amount from conan_private.day_stats(joined+6) where day>=joined;
    select 1+count(*)::integer into placement from generate_series(0,28) i where conan_private.bot_xp(joined::text,tier,i)>=amount;
    slots:=(array[20,15,10,7,7,7,7,7,5,0])[tier+1];
    outcome:=case when amount=0 then 'stayed' when placement<=slots then 'promoted' when placement>=26 and tier>0 then 'demoted' else 'stayed' end;
    history:=history||jsonb_build_array(jsonb_build_object('week',joined,'tier',tier,'rank',placement,'xp',amount,'result',outcome));
    tier:=greatest(0,least(9,tier+case outcome when 'promoted' then 1 when 'demoted' then -1 else 0 end));
  end if;
  g:=jsonb_set(g,'{league}',jsonb_build_object('tier',tier,'joinedWeek',null,'history',history));
  update public.game_state set data=g,updated_at=now() where id=1;
end; $$;

create function public.game_action(p_action jsonb) returns void language plpgsql security definer set search_path='' as $$
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
    select coalesce(sum(coins),0)-(g->>'spentCoins')::bigint,coalesce(sum(extras),0) into amount,extra_count from conan_private.day_stats(public.app_today());
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
revoke all on function public.game_action(jsonb) from public,anon,authenticated;
grant execute on function public.game_action(jsonb) to authenticated;

-- Preserve the existing snapshot contract and add actor-specific read receipts.
alter function public.app_snapshot() rename to app_snapshot_before_game;
revoke all on function public.app_snapshot_before_game() from public,anon,authenticated;
create function public.app_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare g jsonb; receipt public.game_receipts%rowtype;
begin
  perform public.require_app_role(array['learner','mentor','parent']);
  perform conan_private.settle_league();
  select data into g from public.game_state where id=1;
  select * into receipt from public.game_receipts where user_id=auth.uid();
  g:=g||jsonb_build_object('seenMilestones',coalesce(receipt.seen_milestones,'[]'::jsonb),'readMessageIds',coalesce(receipt.read_message_ids,'[]'::jsonb));
  return public.app_snapshot_before_game()||jsonb_build_object('game',g);
end; $$;
revoke all on function public.app_snapshot() from public,anon,authenticated;
grant execute on function public.app_snapshot() to authenticated;
revoke all on all functions in schema conan_private from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatar-assets','avatar-assets',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy avatar_read on storage.objects for select to authenticated using(bucket_id='avatar-assets' and public.app_role() is not null);
create policy avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatar-assets' and public.app_role() in ('learner','mentor') and (storage.foldername(name))[1]=auth.uid()::text and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$');
create policy avatar_delete on storage.objects for delete to authenticated using(bucket_id='avatar-assets' and public.app_role() in ('learner','mentor') and (storage.foldername(name))[1]=auth.uid()::text);
-- Realtime remains family-only through table SELECT policies.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.game_state,public.game_receipts;
  end if;
end; $$;

-- Original cosmetic catalog: mirrored by src/shop-catalog.ts and checked by tests.
insert into public.cosmetic_catalog values
('frame-starter','frame',0,0,0),
('frame-flame-1','frame',100,0,0),
('frame-flame-2','frame',500,10,0),
('frame-flame-3','frame',1800,30,0),
('frame-flame-4','frame',4000,60,0),
('frame-flame-5','frame',8500,100,50),
('frame-football-1','frame',100,0,0),
('frame-football-2','frame',500,10,0),
('frame-football-3','frame',1800,30,0),
('frame-football-4','frame',4000,60,0),
('frame-football-5','frame',8500,100,50),
('frame-detective-1','frame',100,0,0),
('frame-detective-2','frame',500,10,0),
('frame-detective-3','frame',1800,30,0),
('frame-detective-4','frame',4000,60,0),
('frame-detective-5','frame',8500,100,50),
('frame-manga-1','frame',100,0,0),
('frame-manga-2','frame',500,10,0),
('frame-manga-3','frame',1800,30,0),
('frame-manga-4','frame',4000,60,0),
('frame-manga-5','frame',8500,100,50),
('frame-builder-1','frame',100,0,0),
('frame-builder-2','frame',500,10,0),
('frame-builder-3','frame',1800,30,0),
('frame-builder-4','frame',4000,60,0),
('frame-builder-5','frame',8500,100,50),
('frame-space-1','frame',100,0,0),
('frame-space-2','frame',500,10,0),
('frame-space-3','frame',1800,30,0),
('frame-space-4','frame',4000,60,0),
('frame-space-5','frame',8500,100,50),
('banner-flame-1','banner',150,0,0),
('banner-flame-2','banner',900,14,0),
('banner-football-1','banner',150,0,0),
('banner-football-2','banner',900,14,0),
('banner-detective-1','banner',150,0,0),
('banner-detective-2','banner',900,14,0),
('banner-manga-1','banner',150,0,0),
('banner-manga-2','banner',900,14,0),
('banner-builder-1','banner',150,0,0),
('banner-builder-2','banner',900,14,0),
('banner-space-1','banner',150,0,0),
('banner-space-2','banner',900,14,0),
('title-flame-1','title',100,0,0),
('title-flame-2','title',600,7,0),
('title-football-1','title',100,0,0),
('title-football-2','title',600,7,0),
('title-detective-1','title',100,0,0),
('title-detective-2','title',600,7,0),
('title-manga-1','title',100,0,0),
('title-manga-2','title',600,7,0),
('title-builder-1','title',100,0,0),
('title-builder-2','title',600,7,0),
('title-space-1','title',100,0,0),
('title-space-2','title',600,7,0),
('celebration-flame','celebration',300,0,0),
('celebration-football','celebration',300,0,0),
('celebration-detective','celebration',300,0,0),
('celebration-manga','celebration',1500,30,0),
('celebration-builder','celebration',1500,30,0),
('celebration-space','celebration',1500,30,0),
('pet-cat','pet',500,0,0),
('pet-robot','pet',500,0,0),
('pet-fox','pet',1500,10,0),
('pet-wolf','pet',1500,10,0),
('pet-phoenix','pet',3500,30,0),
('pet-dragon','pet',3500,30,0),
('weapon-fire-1','weapon',400,0,0),
('weapon-fire-2','weapon',2400,30,0),
('weapon-water-1','weapon',400,0,0),
('weapon-water-2','weapon',2400,30,0),
('weapon-lightning-1','weapon',400,0,0),
('weapon-lightning-2','weapon',2400,30,0),
('weapon-ice-1','weapon',400,0,0),
('weapon-ice-2','weapon',2400,30,0),
('weapon-moon-1','weapon',400,0,0),
('weapon-moon-2','weapon',2400,30,0),
('weapon-dragon-1','weapon',400,0,0),
('weapon-dragon-2','weapon',2400,30,0);



