import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
import { defaultHabits, defaultProfile } from '../src/defaults'
import { gameStats, leagueBotFinalXp, monthlyProgress } from '../src/gamification'
import { SHOP_ITEMS } from '../src/shop-catalog'
import type { GameAction } from '../src/gamification-types'
import type { Role, Snapshot } from '../src/types'

let db: PGlite
const day = '2026-10-14'
const ids = {
  mentor: '00000000-0000-4000-8000-000000000001',
  learner: '00000000-0000-4000-8000-000000000002',
  parent: '00000000-0000-4000-8000-000000000003',
  outsider: '00000000-0000-4000-8000-000000000004',
}
async function login(role: Role | 'outsider') {
  await db.exec('reset role; set role authenticated;')
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: ids[role], email: `${role}@example.test` }),
  ])
}
async function snapshot() {
  return (await db.query<{ value: Snapshot }>('select app_snapshot() value')).rows[0].value
}
const action = (value: GameAction | Record<string, unknown>) =>
  db.query('select game_action($1::jsonb)', [value])
const save = (date = day, habit = 'grammar', status = 'done', version = 0) =>
  db.query('select save_checkin($1::date,$2,$3,$4,$5::bigint)', [
    date,
    habit,
    status,
    habit === 'review' ? 'Ôn bài' : '',
    version,
  ])
async function seedDays(from: string, through: string, status = 'done') {
  await db.exec('reset role;')
  await db.query(
    `insert into checkins(date,habit_id,status,note,plan_id,updated_by)
    select d::date,h->>'id',$3,case when h->>'id'='review' then 'Ôn bài' else '' end,p.id,$4::uuid
    from generate_series($1::date::timestamp,$2::date::timestamp,interval '1 day') d,
    lateral(select id,habits from plan_versions where effective_from<=d::date order by effective_from desc limit 1) p,
    lateral jsonb_array_elements(p.habits) h`,
    [from, through, status, ids.learner],
  )
  await login('mentor')
}
beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create schema storage;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    create function storage.foldername(path text) returns text[] language sql immutable as $$ select string_to_array(path,'/') $$;
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to anon,authenticated;
    grant execute on all functions in schema auth,storage to anon,authenticated;
    grant select,insert,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns void language plpgsql security definer set search_path='' as $$ begin null; end; $$;`)
  for (const name of (await readdir(new URL('../supabase/migrations/', import.meta.url)))
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    await db.exec(
      await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'),
    )
  }
  await db.exec(
    `create or replace function public.app_today() returns date language sql stable set search_path='' as $$ select date '${day}' $$;`,
  )
}, 60000)
beforeEach(async () => {
  await db.exec(`reset role; truncate memberships,profiles,plan_versions,checkins,excused_days,weekly_reviews,encouragements,goals,rewards,storage.objects,game_receipts;
    insert into memberships values('mentor@example.test','mentor','Anh Khuê'),('learner@example.test','learner','Conan'),('parent@example.test','parent','Ba');
    update game_state set data='{"avatarPath":null,"inventory":["frame-starter"],"equipped":{"frame":"frame-starter"},"spentCoins":0,"repairs":[],"prizeCatalog":[],"prizeRequests":[],"league":{"tier":0,"joinedWeek":null,"history":[]}}';`)
  await login('mentor')
  await db.query('select initialize_tracker($1::jsonb,$2::jsonb)', [
    { ...defaultProfile(), startedOn: '2026-09-01' },
    defaultHabits(),
  ])
})
afterAll(async () => {
  await db?.close()
})

describe('ConanHabit authoritative wallet and catalog', () => {
  it('seeds exactly the reviewed catalog and preserves legacy snapshot/auth contracts', async () => {
    const data = await snapshot()
    expect(data.game!.inventory).toEqual(['frame-starter'])
    expect(data.checkins).toEqual([])
    await db.exec('reset role;')
    const catalog = (
      await db.query(
        'select id,category,price,streak_required as "streakRequired",extra_required as "extraRequired" from cosmetic_catalog order by id',
      )
    ).rows
    expect(catalog).toEqual(
      SHOP_ITEMS.map(({ id, category, price, streakRequired, extraRequired }) => ({
        id,
        category,
        price,
        streakRequired,
        extraRequired,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    )
    await login('outsider')
    await expect(snapshot()).rejects.toThrow('chưa được phép')
    await expect(action({ type: 'buy', itemId: 'frame-flame-1' })).rejects.toThrow('chưa được phép')
  })
  it('blocks direct wallet writes, private helpers, legacy snapshot and parent spending', async () => {
    await login('learner')
    await expect(
      db.exec("update game_state set data=jsonb_set(data,'{spentCoins}','-999')"),
    ).rejects.toThrow('permission denied')
    await expect(db.exec('select conan_private.best_streak()')).rejects.toThrow('permission denied')
    await expect(db.exec('select app_snapshot_before_game()')).rejects.toThrow('permission denied')
    await login('parent')
    await expect(action({ type: 'buy', itemId: 'frame-flame-1' })).rejects.toThrow('Conan')
  })
  it('uses authoritative price, deduplicates simultaneous retries, and never spends XP', async () => {
    await seedDays('2026-10-12', '2026-10-13')
    await login('learner')
    const before = await snapshot()
    await Promise.all([
      action({ type: 'buy', itemId: 'frame-flame-1', price: 0 }),
      action({ type: 'buy', itemId: 'frame-flame-1' }),
    ])
    const after = await snapshot()
    expect(after.game!.spentCoins).toBe(100)
    expect(after.game!.inventory.filter((i) => i === 'frame-flame-1')).toHaveLength(1)
    expect(gameStats(after, day).xp).toBe(gameStats(before, day).xp)
    expect(gameStats(after, day).coins).toBe(gameStats(before, day).coins - 100)
    await action({ type: 'equip', category: 'frame', itemId: 'frame-flame-1' })
    expect((await snapshot()).game!.equipped.frame).toBe('frame-flame-1')
    await expect(
      action({ type: 'equip', category: 'pet', itemId: 'frame-flame-1' }),
    ).rejects.toThrow('phù hợp')
  })
  it('checks insufficient funds and streak/extra gates on server, retaining owned inventory after undo', async () => {
    await expect(action({ type: 'buy', itemId: 'frame-flame-1' })).rejects.toThrow('Coin')
    await seedDays('2026-10-01', '2026-10-13', 'extra')
    await action({ type: 'buy', itemId: 'frame-flame-2' })
    await expect(action({ type: 'buy', itemId: 'frame-flame-3' })).rejects.toThrow('điều kiện')
    await db.exec('reset role; delete from checkins;')
    await login('mentor')
    const data = await snapshot()
    expect(data.game!.spentCoins).toBe(500)
    expect(data.game!.inventory).toContain('frame-flame-2')
    expect(gameStats(data, day).coins).toBe(0)
    await seedDays('2026-10-12', '2026-10-13')
    expect(gameStats(await snapshot(), day).coins).toBe(0)
  })
  it('matches domain point totals for minimum/extra/rest/historical plans and historical XP belongs to original week', async () => {
    await seedDays('2026-10-01', '2026-10-13')
    await save('2026-10-13', 'grammar', 'minimum', 1)
    await save('2026-10-12', 'anki', 'extra', 1)
    await db.query('select save_excuse($1::date,$2,false)', ['2026-10-10', 'Nghỉ'])
    const data = await snapshot(),
      stats = gameStats(data, day)
    await db.exec('reset role;')
    const totals = (
      await db.query<{ coins: number; xp: number; extras: number }>(
        'select sum(coins)::integer coins,sum(xp)::integer xp,sum(extras)::integer extras from conan_private.day_stats(app_today())',
      )
    ).rows[0]
    expect(totals).toEqual({ coins: stats.earnedCoins, xp: stats.xp, extras: stats.extraCount })
    expect(
      (await db.query<{ value: number }>('select conan_private.best_streak() value')).rows[0].value,
    ).toBe(stats.bestStreak)
  })
})

describe('streak repair, per-user receipts and private avatars', () => {
  it('allows one missed day per calendar month, mentor approval only, with no fabricated work', async () => {
    await seedDays('2026-10-01', '2026-10-13')
    await save('2026-10-10', 'grammar', 'not_started', 1)
    await login('learner')
    const before = await snapshot()
    await action({
      type: 'repair-request',
      date: '2026-10-10',
      reason: 'Quên',
      prevention: 'Đặt nhắc giờ',
    })
    const request = (await snapshot()).game!.repairs[0]
    await expect(
      action({ type: 'repair-request', date: '2026-10-11', reason: 'Quên', prevention: 'Nhắc' }),
    ).rejects.toThrow()
    await expect(action({ type: 'repair-review', id: request.id, approve: true })).rejects.toThrow(
      'Khuê',
    )
    await login('parent')
    await expect(action({ type: 'repair-review', id: request.id, approve: true })).rejects.toThrow(
      'Khuê',
    )
    await login('mentor')
    await action({ type: 'repair-review', id: request.id, approve: true })
    const after = await snapshot()
    expect(after.checkins).toEqual(before.checkins)
    expect(gameStats(after, day).xp).toBe(gameStats(before, day).xp)
    expect(gameStats(after, day).bestStreak).toBe(12)
    await expect(action({ type: 'repair-review', id: request.id, approve: true })).rejects.toThrow(
      'chờ duyệt',
    )
  })
  it('rejects future, old, complete and excused dates without consuming repair quota', async () => {
    await seedDays('2026-10-12', '2026-10-12')
    for (const date of [day, '2026-10-01', '2026-10-12'])
      await expect(
        action({ type: 'repair-request', date, reason: 'Lý do', prevention: 'Cách sửa' }),
      ).rejects.toThrow('7 ngày')
    await db.query('select save_excuse($1::date,$2,false)', ['2026-10-13', 'Nghỉ'])
    await expect(
      action({
        type: 'repair-request',
        date: '2026-10-13',
        reason: 'Lý do',
        prevention: 'Cách sửa',
      }),
    ).rejects.toThrow('7 ngày')
    expect((await snapshot()).game!.repairs).toEqual([])
  })
  it('stores message and milestone read state for each authenticated viewer', async () => {
    await db.query('select save_encouragement($1,null)', ['Ba mẹ tin em'])
    const message = (await snapshot()).messages[0]
    await action({ type: 'read', ids: [message.id, 'does-not-exist'] })
    await action({ type: 'seen', keys: ['global:10'] })
    expect((await snapshot()).game!.readMessageIds).toEqual([message.id])
    await login('learner')
    expect((await snapshot()).game!.readMessageIds).toEqual([])
    expect((await snapshot()).game!.seenMilestones).toEqual([])
    expect((await db.query('select * from game_receipts')).rows).toEqual([])
    await expect(action({ type: 'seen', keys: [123] })).rejects.toThrow('Mã')
  })
  it('allows learner-owned private avatars and rejects parent/outsider/foreign paths', async () => {
    const mine = `${ids.learner}/00000000-0000-4000-8000-000000000005.png`
    await login('learner')
    await db.query("insert into storage.objects(bucket_id,name) values('avatar-assets',$1)", [mine])
    await action({ type: 'avatar', path: mine })
    expect((await snapshot()).game!.avatarPath).toBe(mine)
    await expect(
      db.query("insert into storage.objects(bucket_id,name) values('avatar-assets',$1)", [
        `${ids.mentor}/00000000-0000-4000-8000-000000000006.png`,
      ]),
    ).rejects.toThrow('row-level security')
    await login('parent')
    await expect(action({ type: 'avatar', path: mine })).rejects.toThrow('Conan')
    await expect(
      db.query("insert into storage.objects(bucket_id,name) values('avatar-assets',$1)", [
        `${ids.parent}/00000000-0000-4000-8000-000000000006.png`,
      ]),
    ).rejects.toThrow('row-level security')
    await login('mentor')
    await expect(action({ type: 'avatar', path: mine })).rejects.toThrow('tài khoản này')
    await login('outsider')
    expect((await db.query('select * from storage.objects')).rows).toEqual([])
  })
})

describe('calendar gifts and weekly league settlement', () => {
  it('enforces full months, custom wishes, adult approval/delivery and one reward without currency cost', async () => {
    await seedDays('2026-09-01', '2026-09-30')
    await login('learner')
    const before = await snapshot()
    expect(monthlyProgress(before, '2026-09', day).eligible).toBe(true)
    await action({ type: 'prize-request', month: '2026-09', title: 'Đi ăn cùng gia đình' })
    await expect(
      action({ type: 'prize-request', month: '2026-09', title: 'Quà thứ hai' }),
    ).rejects.toThrow('đã có')
    const request = (await snapshot()).game!.prizeRequests[0]
    await expect(
      action({ type: 'prize-review', id: request.id, status: 'approved' }),
    ).rejects.toThrow('Ba mẹ')
    await login('parent')
    await action({ type: 'prize-review', id: request.id, status: 'approved' })
    await action({ type: 'prize-review', id: request.id, status: 'delivered' })
    expect((await snapshot()).game!.spentCoins).toBe(before.game!.spentCoins)
    await expect(
      action({ type: 'prize-review', id: request.id, status: 'approved' }),
    ).rejects.toThrow('Trạng thái')
  })
  it('allows approved rest and one repair, rejects partial starting/current months and stale approval', async () => {
    await seedDays('2026-09-01', '2026-09-30')
    await db.query('select save_excuse($1::date,$2,false)', ['2026-09-10', 'Nghỉ'])
    await action({ type: 'prize-request', month: '2026-09', title: 'Món quà' })
    const request = (await snapshot()).game!.prizeRequests[0]
    await save('2026-09-12', 'grammar', 'not_started', 1)
    await expect(
      action({ type: 'prize-review', id: request.id, status: 'approved' }),
    ).rejects.toThrow('thay đổi')
    await expect(
      action({ type: 'prize-request', month: '2026-10', title: 'Món quà' }),
    ).rejects.toThrow('chưa đủ')
    await db.exec(
      "reset role; update profiles set data=jsonb_set(data,'{startedOn}','\"2026-09-02\"');",
    )
    await login('mentor')
    await expect(
      action({ type: 'prize-request', month: '2026-09', title: 'Món quà' }),
    ).rejects.toThrow('chưa đủ')
  })
  it('matches deterministic league bots in all tiers and settles a joined week exactly once', async () => {
    await seedDays('2026-10-05', '2026-10-11', 'extra')
    await db.exec('reset role;')
    for (const tier of [0, 1, 5, 9])
      for (const index of [0, 3, 7, 14, 23, 28]) {
        const actual = (
          await db.query<{ xp: number }>(
            'select conan_private.bot_xp($1,$2::integer,$3::integer) xp',
            ['2026-10-05', tier, index],
          )
        ).rows[0].xp
        expect(actual).toBe(leagueBotFinalXp('2026-10-05', tier, index))
      }
    await db.exec(
      `update game_state set data=jsonb_set(data,'{league,joinedWeek}','"2026-10-05"');`,
    )
    await login('learner')
    const first = await snapshot(),
      second = await snapshot()
    expect(first.game!.league).toEqual(second.game!.league)
    expect(first.game!.league.history).toHaveLength(1)
    expect(first.game!.league.history[0].result).toBe('promoted')
    expect(first.game!.league.tier).toBe(1)
    await action({ type: 'league-join' })
    expect((await snapshot()).game!.league.joinedWeek).toBe('2026-10-12')
    await login('mentor')
    await save('2026-10-05', 'grammar', 'not_started', 1)
    expect((await snapshot()).game!.league.history).toEqual(first.game!.league.history)
  })
  it('does not demote unjoined/inactive weeks', async () => {
    await db.exec(`reset role; update game_state set data=jsonb_set(data,'{league,tier}','5');`)
    await login('learner')
    expect((await snapshot()).game!.league).toEqual({ tier: 5, joinedWeek: null, history: [] })
    await db.exec(
      `reset role; update game_state set data=jsonb_set(data,'{league,joinedWeek}','"2026-10-05"');`,
    )
    await login('learner')
    const settled = (await snapshot()).game!.league
    expect(settled.tier).toBe(5)
    expect(settled.history[0]).toMatchObject({ rank: 30, xp: 0, result: 'stayed' })
  })
  it('uses the real calendar length including leap years and approved monthly exceptions', async () => {
    await db.exec(`reset role;
      update profiles set data=jsonb_set(data,'{startedOn}','"2024-01-01"');
      update plan_versions set effective_from='2024-01-01';`)
    await seedDays('2024-02-01', '2024-02-29')
    await save('2024-02-15', 'grammar', 'not_started', 1)
    await db.exec(`reset role; update game_state set data=jsonb_set(data,'{repairs}',
      '[{"id":"historical-approved","date":"2024-02-15","reason":"Quên","prevention":"Nhắc","status":"approved","createdAt":"2024-02-16T00:00:00Z"}]');`)
    await login('mentor')
    await db.query('select save_excuse($1::date,$2,false)', ['2024-02-20', 'Nghỉ được duyệt'])
    const data = await snapshot()
    expect(monthlyProgress(data, '2024-02', day)).toMatchObject({
      eligible: true,
      total: 29,
      completed: 29,
    })
    await action({ type: 'prize-request', month: '2024-02', title: 'Đi chơi cùng gia đình' })
    expect((await snapshot()).game!.prizeRequests).toHaveLength(1)
    await db.exec('reset role;')
    const eligible = (
      await db.query<{ value: boolean }>("select conan_private.month_eligible('2024-02') value")
    ).rows[0].value
    expect(eligible).toBe(true)
    expect(
      (await db.query<{ value: boolean }>("select conan_private.month_eligible('2024-13') value"))
        .rows[0].value,
    ).toBe(false)
  })
})
