-- Additive upgrade: preserve historical schedules and every existing check-in.
alter table public.plan_versions add column if not exists revision integer not null default 1 check (revision > 0);

create or replace function public.app_snapshot() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare result jsonb;
begin
  perform public.require_app_role(array['learner','mentor','parent']);
  select jsonb_build_object(
    'actor',jsonb_build_object('id',auth.uid(),'email',auth.jwt()->>'email','role',m.role,'name',m.display_name),
    'profile',(select data from profiles where id=1),
    'plans',coalesce((select jsonb_agg(jsonb_build_object('id',id,'effectiveFrom',effective_from,'phase',phase,'revision',revision,'habits',habits) order by effective_from) from plan_versions),'[]'::jsonb),
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
  insert into plan_versions(effective_from,phase,habits) values((p_profile->>'startedOn')::date,3,p_habits);
end; $$;

-- Cached old clients must reload rather than silently replacing future schedules.
create or replace function public.save_plan(p_effective_from date,p_phase smallint,p_habits jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_app_role(array['mentor']);
  raise exception 'Giao diện đã được cập nhật. Tải lại trang trước khi sửa lịch.';
end; $$;

create or replace function public.save_plan_v2(p_effective_from date,p_plan_id uuid,p_expected_revision integer,p_habits jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_plan public.plan_versions%rowtype;
begin
  perform public.require_app_role(array['mentor']);
  perform public.validate_habits(p_habits);
  if p_plan_id is null then
    if p_effective_from is null or p_expected_revision is not null then raise exception 'Thông tin lịch mới chưa hợp lệ.'; end if;
    if p_effective_from <= public.app_today() then raise exception 'Kế hoạch mới cần áp dụng từ ngày mai trở đi.'; end if;
    begin
      insert into public.plan_versions(effective_from,phase,habits) values(p_effective_from,3,p_habits);
    exception when unique_violation then
      raise exception 'Ngày này đã có lịch. Chọn sửa lịch sắp áp dụng.';
    end;
  else
    if p_effective_from is not null or p_expected_revision is null then raise exception 'Thông tin sửa lịch chưa hợp lệ.'; end if;
    select * into current_plan from public.plan_versions where id=p_plan_id for update;
    if not found or current_plan.effective_from <= public.app_today() then raise exception 'Chỉ sửa được lịch chưa có hiệu lực.'; end if;
    if current_plan.revision <> p_expected_revision then raise exception 'Lịch vừa được sửa ở nơi khác. Hãy xem lại trước khi lưu.' using errcode='40001'; end if;
    update public.plan_versions set habits=p_habits,phase=3,revision=revision+1 where id=p_plan_id;
  end if;
end; $$;
revoke all on function public.save_plan_v2(date,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_plan_v2(date,uuid,integer,jsonb) to authenticated;

-- Switch on the Vietnam rollout date. Older phase values remain historical facts.
do $$
declare rollout date := public.app_today(); current_plan public.plan_versions%rowtype;
begin
  select * into current_plan from public.plan_versions where effective_from <= rollout order by effective_from desc limit 1;
  if found and current_plan.phase < 3 then
    if current_plan.effective_from = rollout then
      update public.plan_versions set phase=3,revision=revision+1 where id=current_plan.id;
    else
      insert into public.plan_versions(effective_from,phase,habits) values(rollout,3,current_plan.habits);
    end if;
  end if;
  update public.plan_versions set phase=3,revision=revision+1 where effective_from > rollout and phase < 3;
end; $$;
