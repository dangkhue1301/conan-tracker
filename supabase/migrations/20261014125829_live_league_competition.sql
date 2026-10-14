-- Score ceilings increase with each league; settled and older seasons keep v1.
-- Mirror leagueBotFinalXp in src/gamification.ts. This private function retains
-- its existing privileges and never changes player XP, Coin, or past results.
create or replace function conan_private.bot_xp(p_week text,p_tier integer,p_index integer)
returns integer language plpgsql immutable set search_path='' as $$
declare
  level integer:=greatest(0,least(9,p_tier));
  seed bigint:=7;
  rotation bigint:=7;
  value text;
  position integer;
  ability integer;
  band integer;
  bronze integer;
  diamond integer;
  raw integer;
  i integer;
begin
  if p_week<'2026-10-12' then
    value:=p_week||':'||level||':'||p_index;
    for i in 1..length(value) loop seed:=(seed*31+ascii(substr(value,i,1)))%2147483647; end loop;
    raw:=case when p_index<3 then 1350+seed%201 when p_index<7 then 980+seed%201 when p_index<14 then 700+seed%351 when p_index<23 then 350+seed%451 else 100+seed%351 end;
    return (raw::bigint*(765+level*15)/900)::integer;
  end if;
  for i in 1..length(p_week) loop rotation:=(rotation*31+ascii(substr(p_week,i,1)))%2147483647; end loop;
  position:=(p_index+rotation)%29;
  band:=case when position<3 then 1 when position<7 then 2 when position<14 then 3 when position<23 then 4 else 5 end;
  value:=p_week||':'||p_index||':live-v2';
  for i in 1..length(value) loop seed:=(seed*31+ascii(substr(value,i,1)))%2147483647; end loop;
  ability:=seed%1001;
  bronze:=(array[700,500,300,130,60])[band]+ability*(array[200,180,190,190,130])[band]/1000;
  diamond:=(array[1430,1300,1120,920,700])[band]+ability*(array[150,170,220,270,250])[band]/1000;
  return (bronze::bigint*(9-level)+diamond::bigint*level)/9;
end; $$;
