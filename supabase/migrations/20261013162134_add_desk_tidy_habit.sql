-- Add the seventh habit from today's Vietnamese date, preserving earlier requirements.
alter table public.checkins drop constraint if exists checkins_habit_id_check;
alter table public.checkins add constraint checkins_habit_id_check
  check (habit_id in ('anki','grammar','mental','review','reading','writing','tidy'));

create or replace function public.validate_habits(habits jsonb)
returns void language plpgsql set search_path = '' as $$
declare h jsonb; s jsonb; d int; ids text[]; target int; minimum int;
begin
  if jsonb_typeof(habits) is distinct from 'array' or jsonb_array_length(habits) <> 7 then
    raise exception 'Cần đủ bảy thói quen. Tải lại trang để nhận việc dọn bàn học.';
  end if;
  select array_agg(value->>'id' order by value->>'id') into ids from jsonb_array_elements(habits);
  if ids is distinct from array['anki','grammar','mental','reading','review','tidy','writing'] then
    raise exception 'Danh sách thói quen không hợp lệ.';
  end if;
  for h in select value from jsonb_array_elements(habits) loop
    if length(trim(coalesce(h->>'title',''))) not between 1 and 100
       or coalesce(h->>'unit','') not in ('phút','câu','trang')
       or coalesce(h->>'period','') not in ('morning','review','evening')
       or jsonb_typeof(h->'url') is distinct from 'string' then
      raise exception 'Tên, đơn vị hoặc buổi học chưa hợp lệ.';
    end if;
    if coalesce(h->>'target','') !~ '^[0-9]+$' then raise exception 'Mốc làm đủ phải là số nguyên.'; end if;
    target := (h->>'target')::int;
    if target<1 or target>10000 then raise exception 'Mốc làm đủ chưa hợp lệ.'; end if;
    if h->>'minimum' is not null then
      if h->>'minimum' !~ '^[0-9]+$' then raise exception 'Mốc ít nhất phải là số nguyên.'; end if;
      minimum := (h->>'minimum')::int;
      if minimum<1 or minimum>target then raise exception 'Mốc ít nhất không được vượt mức làm đủ.'; end if;
    end if;
    if coalesce(h->>'url','')<>'' and (h->>'url' !~ '^https?://' or length(h->>'url')>2048) then
      raise exception 'URL học cần bắt đầu bằng http:// hoặc https://.';
    end if;
    for d in 1..7 loop
      s := h->'schedule'->d::text;
      if jsonb_typeof(s) is distinct from 'object'
         or jsonb_typeof(s->'time') is distinct from 'string'
         or jsonb_typeof(s->'subject') is distinct from 'string'
         or (s->>'time'<>'' and s->>'time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
         or length(s->>'subject')>100 then raise exception 'Lịch theo thứ chưa hợp lệ.'; end if;
    end loop;
  end loop;
end; $$;
revoke all on function public.validate_habits(jsonb) from public,anon,authenticated;

do $$
declare
  rollout date := public.app_today();
  current_plan public.plan_versions%rowtype;
  tidy jsonb := jsonb_build_object(
    'id','tidy','title','Dọn bàn học và sách vở','minimum',null,'target',5,
    'unit','phút','url','','period','evening','schedule',
    (select jsonb_object_agg(d::text,jsonb_build_object('time','','subject','')) from generate_series(1,7) d)
  );
  next_habits jsonb;
begin
  lock table public.plan_versions in share row exclusive mode;
  select * into current_plan from public.plan_versions
    where effective_from <= rollout order by effective_from desc limit 1;
  if found and (current_plan.phase < 3 or not current_plan.habits @> '[{"id":"tidy"}]'::jsonb) then
    next_habits := current_plan.habits;
    if not next_habits @> '[{"id":"tidy"}]'::jsonb then
      next_habits := next_habits || jsonb_build_array(tidy);
    end if;
    perform public.validate_habits(next_habits);
    if current_plan.effective_from = rollout then
      update public.plan_versions set habits=next_habits,phase=3,revision=revision+1
        where id=current_plan.id;
    else
      insert into public.plan_versions(effective_from,phase,habits) values(rollout,3,next_habits);
    end if;
  end if;
  update public.plan_versions set
    habits=habits || jsonb_build_array(tidy),phase=3,revision=revision+1
    where effective_from > rollout and not habits @> '[{"id":"tidy"}]'::jsonb;
end; $$;
