-- Run once in a NEW Supabase project's SQL editor. Personal records are never seeded here.
create table if not exists public.memberships (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('learner','mentor','parent')),
  display_name text not null check (length(display_name) between 1 and 100)
);
create table if not exists public.profiles (id int primary key check (id = 1), data jsonb not null);
create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(), effective_from date not null unique,
  phase smallint not null check (phase between 1 and 3), habits jsonb not null
);
create table if not exists public.checkins (
  date date not null, habit_id text not null check (habit_id in ('anki','grammar','mental','review','reading','writing')),
  status text not null check (status in ('not_started','minimum','done','extra')), note text not null default '' check (length(note) <= 500),
  plan_id uuid not null references public.plan_versions(id), version bigint not null default 1,
  updated_by uuid not null, updated_at timestamptz not null default now(), primary key (date, habit_id)
);
create table if not exists public.excused_days (date date primary key, reason text not null check (length(reason) between 1 and 300));
create table if not exists public.weekly_reviews (week_start date primary key, data jsonb not null);
create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(), author_id uuid not null, author_name text not null,
  body text not null check (length(body) between 1 and 1000), image_path text, created_at timestamptz not null default now()
);
create table if not exists public.goals (id uuid primary key, data jsonb not null);
create table if not exists public.rewards (id int primary key check (id=1), data jsonb not null);

create or replace function public.app_role() returns text language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.memberships where email = lower(auth.jwt()->>'email') and auth.uid() is not null;
$$;
create or replace function public.app_today() returns date language sql stable set search_path = public, pg_temp as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;
create or replace function public.require_app_role(allowed text[]) returns void language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.app_role() is null or not (public.app_role() = any(allowed)) then
    raise exception 'Tài khoản chưa được phép thực hiện thao tác này.' using errcode = '42501';
  end if;
end; $$;

-- Clients can select only approved family data. All writes go through validated RPCs.
do $$ declare t text; begin
  foreach t in array array['memberships','profiles','plan_versions','checkins','excused_days','weekly_reviews','encouragements','goals','rewards'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='approved_read') then
      execute format('create policy approved_read on public.%I for select to authenticated using (public.app_role() is not null)',t);
    end if;
  end loop;
end; $$;
-- The allowlist is managed in Supabase, never exposed as an editable client-side role switch.
drop policy if exists approved_read on public.memberships;
create policy approved_read on public.memberships for select to authenticated using (email=lower(auth.jwt()->>'email'));
drop policy if exists approved_read on public.rewards;
create policy approved_read on public.rewards for select to authenticated using (
  public.app_role()='mentor' or (public.app_role() in ('learner','parent') and (data->>'visible')::boolean)
);

create or replace function public.validate_habits(habits jsonb) returns void language plpgsql set search_path = public, pg_temp as $$
declare h jsonb; s jsonb; d int; ids text[]; target int; minimum int;
begin
  if jsonb_typeof(habits) is distinct from 'array' or jsonb_array_length(habits) <> 6 then raise exception 'Cần đủ sáu thói quen.'; end if;
  select array_agg(value->>'id' order by value->>'id') into ids from jsonb_array_elements(habits);
  if ids <> array['anki','grammar','mental','reading','review','writing'] then raise exception 'Danh sách thói quen không hợp lệ.'; end if;
  for h in select value from jsonb_array_elements(habits) loop
    if length(trim(coalesce(h->>'title',''))) not between 1 and 100 or coalesce(h->>'unit','') not in ('phút','câu','trang') or coalesce(h->>'period','') not in ('morning','review','evening') or jsonb_typeof(h->'url') is distinct from 'string' then raise exception 'Tên, đơn vị hoặc buổi học chưa hợp lệ.'; end if;
    if coalesce(h->>'target','') !~ '^[0-9]+$' then raise exception 'Mốc làm đủ phải là số nguyên.'; end if;
    target := (h->>'target')::int;
    if target<1 or target>10000 then raise exception 'Mốc làm đủ chưa hợp lệ.'; end if;
    if h->>'minimum' is not null then
      if h->>'minimum' !~ '^[0-9]+$' then raise exception 'Mốc ít nhất phải là số nguyên.'; end if;
      minimum := (h->>'minimum')::int;
      if minimum<1 or minimum>target then raise exception 'Mốc ít nhất không được vượt mức làm đủ.'; end if;
    end if;
    if coalesce(h->>'url','')<>'' and (h->>'url' !~ '^https?://' or length(h->>'url')>2048) then raise exception 'URL học cần bắt đầu bằng http:// hoặc https://.'; end if;
    for d in 1..7 loop
      s := h->'schedule'->d::text;
      if jsonb_typeof(s) is distinct from 'object' or jsonb_typeof(s->'time') is distinct from 'string' or jsonb_typeof(s->'subject') is distinct from 'string' or (s->>'time'<>'' and s->>'time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') or length(s->>'subject')>100 then raise exception 'Lịch theo thứ chưa hợp lệ.'; end if;
    end loop;
  end loop;
end; $$;
create or replace function public.validate_asset_path(path text) returns void language plpgsql stable set search_path = public, pg_temp as $$
begin
  if path is not null and (path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$' or not exists(select 1 from storage.objects where bucket_id='family-assets' and name=path)) then raise exception 'Ảnh chưa được tải lên hoặc không hợp lệ.'; end if;
end; $$;

create or replace function public.app_snapshot() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare result jsonb;
begin
  perform public.require_app_role(array['learner','mentor','parent']);
  select jsonb_build_object(
    'actor',jsonb_build_object('id',auth.uid(),'email',auth.jwt()->>'email','role',m.role,'name',m.display_name),
    'profile',(select data from profiles where id=1),
    'plans',coalesce((select jsonb_agg(jsonb_build_object('id',id,'effectiveFrom',effective_from,'phase',phase,'habits',habits) order by effective_from) from plan_versions),'[]'::jsonb),
    'checkins',coalesce((select jsonb_agg(jsonb_build_object('date',date,'habitId',habit_id,'status',status,'note',note,'planId',plan_id,'version',version,'updatedAt',updated_at,'updatedBy',updated_by)) from checkins),'[]'::jsonb),
    'excuses',coalesce((select jsonb_agg(jsonb_build_object('date',date,'reason',reason)) from excused_days),'[]'::jsonb),
    'reviews',coalesce((select jsonb_agg(data order by week_start desc) from weekly_reviews),'[]'::jsonb),
    'messages',coalesce((select jsonb_agg(jsonb_build_object('id',id,'authorId',author_id,'authorName',author_name,'body',body,'imagePath',image_path,'createdAt',created_at) order by created_at desc) from encouragements),'[]'::jsonb),
    'goals',coalesce((select jsonb_agg(data) from goals),'[]'::jsonb),
    'rewards',coalesce((select jsonb_agg(data) from rewards where public.app_role()='mentor' or (data->>'visible')::boolean),'[]'::jsonb)
  ) into result from memberships m where m.email=lower(auth.jwt()->>'email');
  return result;
end; $$;

create or replace function public.initialize_tracker(p_profile jsonb,p_habits jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor']); perform public.validate_habits(p_habits);
  if exists(select 1 from profiles) then raise exception 'Góc học tập đã được thiết lập.'; end if;
  if length(trim(coalesce(p_profile->>'name',''))) not between 1 and 60 or coalesce(p_profile->>'startedOn','')='' or (p_profile->>'startedOn')::date>public.app_today() or coalesce(p_profile->>'avatar','') not in ('detective','football','builder') or coalesce(p_profile->>'accent','') not in ('teal','blue','violet','orange') then raise exception 'Thông tin khởi đầu chưa hợp lệ.'; end if;
  insert into profiles values(1,jsonb_build_object('name',trim(p_profile->>'name'),'startedOn',p_profile->>'startedOn','avatar',p_profile->>'avatar','accent',p_profile->>'accent','familyPhoto',null));
  insert into plan_versions(effective_from,phase,habits) values((p_profile->>'startedOn')::date,1,p_habits);
end; $$;

create or replace function public.save_plan(p_effective_from date,p_phase smallint,p_habits jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor']); perform public.validate_habits(p_habits);
  if p_effective_from<=public.app_today() then raise exception 'Kế hoạch mới cần áp dụng từ ngày mai trở đi.'; end if;
  insert into plan_versions(effective_from,phase,habits) values(p_effective_from,p_phase,p_habits)
    on conflict(effective_from) do update set phase=excluded.phase, habits=excluded.habits;
end; $$;

create or replace function public.save_checkin(p_date date,p_habit_id text,p_status text,p_note text,p_expected_version bigint) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare role text; plan plan_versions%rowtype; habit jsonb; saved bool; current_day date;
begin
  perform public.require_app_role(array['mentor','learner']); role:=public.app_role(); current_day:=public.app_today();
  if p_date>current_day or p_date<(select (data->>'startedOn')::date from profiles where id=1) or (role='learner' and p_date<current_day-(extract(isodow from current_day)::int-1)) then raise exception 'Bạn không có quyền sửa ngày này.' using errcode='42501'; end if;
  if exists(select 1 from excused_days where date=p_date) then raise exception 'Ngày này đang được cho nghỉ.'; end if;
  select * into plan from plan_versions where effective_from<=p_date order by effective_from desc limit 1;
  select value into habit from jsonb_array_elements(plan.habits) where value->>'id'=p_habit_id;
  if habit is null or (p_habit_id='writing' and plan.phase<2) or (p_habit_id='review' and plan.phase<3) then raise exception 'Thói quen chưa được bật trong ngày này.'; end if;
  if p_status not in ('not_started','minimum','done','extra') then raise exception 'Mức ghi nhận không hợp lệ.'; end if;
  if p_status='minimum' and (habit->>'minimum' is null or (habit->>'minimum')::int>=(habit->>'target')::int) then raise exception 'Việc này chỉ có mức làm đủ và làm thêm.'; end if;
  if p_habit_id='review' and p_status<>'not_started' and length(trim(coalesce(p_note,'')))=0 then raise exception 'Hãy ghi một dòng về nội dung đã ôn.'; end if;
  insert into checkins(date,habit_id,status,note,plan_id,version,updated_by) values(p_date,p_habit_id,p_status,trim(coalesce(p_note,'')),plan.id,1,auth.uid())
    on conflict(date,habit_id) do update set status=excluded.status,note=excluded.note,plan_id=excluded.plan_id,version=checkins.version+1,updated_by=auth.uid(),updated_at=now()
    where checkins.version=p_expected_version
    returning true into saved;
  if not coalesce(saved,false) then raise exception 'Dữ liệu vừa được cập nhật. Hãy tải lại và xem trước khi lưu.' using errcode='40001'; end if;
  -- A creation with a non-zero expectation is stale too; rollback the transaction.
  if p_expected_version<>0 and exists(select 1 from checkins where date=p_date and habit_id=p_habit_id and version=1) then raise exception 'Bản ghi chưa tồn tại hoặc đã thay đổi.' using errcode='40001'; end if;
end; $$;

create or replace function public.save_preferences(p_avatar text,p_accent text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor','learner']);
  if coalesce(p_avatar,'') not in ('detective','football','builder') or coalesce(p_accent,'') not in ('teal','blue','violet','orange') then raise exception 'Lựa chọn chưa hợp lệ.'; end if;
  update profiles set data=data||jsonb_build_object('avatar',p_avatar,'accent',p_accent) where id=1;
end; $$;
create or replace function public.save_profile(p_name text,p_family_photo text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor']); perform public.validate_asset_path(p_family_photo);
  if length(trim(coalesce(p_name,''))) not between 1 and 60 then raise exception 'Tên gọi cần từ 1 đến 60 ký tự.'; end if;
  update profiles set data=data||jsonb_build_object('name',trim(p_name),'familyPhoto',p_family_photo) where id=1;
end; $$;
create or replace function public.save_excuse(p_date date,p_reason text,p_remove bool default false) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor']);
  if p_date<(select (data->>'startedOn')::date from profiles where id=1) then raise exception 'Ngày này trước khi bắt đầu theo dõi.'; end if;
  if p_remove then delete from excused_days where date=p_date;
  else insert into excused_days values(p_date,trim(p_reason)) on conflict(date) do update set reason=excluded.reason;
  end if;
end; $$;
create or replace function public.save_weekly_review(p_review jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare d date;
begin
  perform public.require_app_role(array['mentor']); d:=(p_review->>'weekStart')::date;
  if d is null or extract(isodow from d)<>1 or d>public.app_today() or coalesce(p_review->>'autonomy','') not in ('less_reminding','same','more_reminding') or length(trim(coalesce(p_review->>'praise','')))=0 or length(p_review->>'praise')>1000 or jsonb_typeof(p_review->'adjustment') is distinct from 'string' or length(p_review->>'adjustment')>1000 then raise exception 'Tổng kết tuần chưa hợp lệ.'; end if;
  insert into weekly_reviews values(d,p_review) on conflict(week_start) do update set data=excluded.data;
end; $$;
create or replace function public.save_encouragement(p_body text,p_image_path text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor','parent']); perform public.validate_asset_path(p_image_path);
  insert into encouragements(author_id,author_name,body,image_path) select auth.uid(),display_name,trim(p_body),p_image_path from memberships where email=lower(auth.jwt()->>'email');
end; $$;
create or replace function public.delete_encouragement(p_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor','parent']);
  if public.app_role()<>'mentor' and not exists(select 1 from encouragements where id=p_id and author_id=auth.uid()) then raise exception 'Bạn chỉ được xoá lời nhắn của mình.' using errcode='42501'; end if;
  delete from encouragements where id=p_id;
end; $$;
create or replace function public.save_goal(p_goal jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m jsonb;
begin
  perform public.require_app_role(array['mentor']); perform public.validate_asset_path(p_goal->>'imagePath');
  perform pg_advisory_xact_lock(472913);
  if not exists(select 1 from goals where id=(p_goal->>'id')::uuid) and (select count(*) from goals)>=2 then raise exception 'Giữ tối đa hai mục tiêu để dễ tập trung.'; end if;
  if length(trim(coalesce(p_goal->>'title',''))) not between 1 and 100 or jsonb_typeof(p_goal->'description') is distinct from 'string' or length(p_goal->>'description')>1000 or jsonb_typeof(p_goal->'milestones') is distinct from 'array' or jsonb_array_length(p_goal->'milestones') not between 1 and 6 then raise exception 'Mục tiêu cần tên và từ 1 đến 6 mốc.'; end if;
  for m in select value from jsonb_array_elements(p_goal->'milestones') loop
    if length(trim(coalesce(m->>'title',''))) not between 1 and 100 or jsonb_typeof(m->'achieved') is distinct from 'boolean' or coalesce(m->>'id','')='' or coalesce(m->>'date','')='' then raise exception 'Mốc mục tiêu chưa hợp lệ.'; end if;
    perform (m->>'date')::date;
  end loop;
  insert into goals values((p_goal->>'id')::uuid,p_goal) on conflict(id) do update set data=excluded.data;
end; $$;
create or replace function public.delete_goal(p_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.require_app_role(array['mentor']); delete from goals where id=p_id; end; $$;
create or replace function public.save_reward(p_reward jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_app_role(array['mentor']); perform public.validate_asset_path(p_reward->>'imagePath');
  if jsonb_typeof(p_reward->'visible') is distinct from 'boolean' or jsonb_typeof(p_reward->'received') is distinct from 'boolean' or jsonb_typeof(p_reward->'title') is distinct from 'string' or jsonb_typeof(p_reward->'conditions') is distinct from 'string' or length(p_reward->>'title')>100 or length(p_reward->>'conditions')>1000 or coalesce(p_reward->>'id','')='' then raise exception 'Thông tin phần thưởng chưa hợp lệ.'; end if;
  if (p_reward->>'visible')::boolean and (length(trim(coalesce(p_reward->>'title','')))=0 or length(trim(coalesce(p_reward->>'conditions','')))=0) then raise exception 'Điền tên và điều kiện trước khi bật phần thưởng.'; end if;
  insert into rewards values(1,p_reward) on conflict(id) do update set data=excluded.data;
end; $$;

-- Restrict RPC execution to signed-in users. Helpers stay owner-only except app_role for RLS.
do $$ declare f record; begin
  for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in ('app_role','app_today','require_app_role','validate_habits','validate_asset_path','app_snapshot','initialize_tracker','save_plan','save_checkin','save_preferences','save_profile','save_excuse','save_weekly_review','save_encouragement','delete_encouragement','save_goal','delete_goal','save_reward') loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    if f.proname not in ('app_today','require_app_role','validate_habits','validate_asset_path') then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('family-assets','family-assets',false,5242880,array['image/jpeg','image/png','image/webp'])
  on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists family_asset_read on storage.objects;
drop policy if exists family_asset_insert on storage.objects;
drop policy if exists family_asset_delete on storage.objects;
create policy family_asset_read on storage.objects for select to authenticated using (bucket_id='family-assets' and public.app_role() is not null);
create policy family_asset_insert on storage.objects for insert to authenticated with check (bucket_id='family-assets' and public.app_role() in ('mentor','parent') and (storage.foldername(name))[1]=auth.uid()::text);
create policy family_asset_delete on storage.objects for delete to authenticated using (bucket_id='family-assets' and (public.app_role()='mentor' or (public.app_role()='parent' and (storage.foldername(name))[1]=auth.uid()::text)));

do $$ declare t text; begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['profiles','plan_versions','checkins','excused_days','weekly_reviews','encouragements','goals','rewards','memberships'] loop
      if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if;
    end loop;
  end if;
end; $$;
