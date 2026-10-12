import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { defaultHabits, defaultProfile } from '../src/defaults'
import type { Role, Snapshot } from '../src/types'

// Real PostgreSQL engine. Only Supabase's auth/storage infrastructure is stubbed.
// These tests execute the delivered migration and its RLS/RPCs, not a rewritten model.
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
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: ids[role], email: `${role}@example.test` }),
  ])
}
async function snapshot() {
  return (await db.query<{ value: Snapshot }>('select app_snapshot() as value')).rows[0].value
}
const save = (date = day, habit = 'grammar', status = 'done', note = '', version = 0) =>
  db.query('select save_checkin($1::date,$2,$3,$4,$5::bigint)', [
    date,
    habit,
    status,
    note,
    version,
  ])

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin;
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
    create function public.rls_auto_enable() returns void language plpgsql security definer set search_path = '' as $$ begin null; end; $$;
  `)
  await db.exec(
    await readFile(new URL('../supabase/migrations/001_tracker.sql', import.meta.url), 'utf8'),
  )
  await db.exec(
    `create or replace function public.app_today() returns date language sql stable set search_path=public,pg_temp as $$ select date '${day}' $$;`,
  )
}, 60000)
beforeEach(async () => {
  await db.exec(`reset role; truncate memberships,profiles,plan_versions,checkins,excused_days,weekly_reviews,encouragements,goals,rewards,storage.objects;
    insert into memberships values('mentor@example.test','mentor','Người hướng dẫn'),('learner@example.test','learner','Conan'),('parent@example.test','parent','Ba');`)
  await login('mentor')
  await db.query('select initialize_tracker($1::jsonb,$2::jsonb)', [
    { ...defaultProfile(), startedOn: '2026-09-21' },
    defaultHabits(),
  ])
})
afterAll(async () => {
  await db?.close()
})

describe('database authorization and data integrity', () => {
  it('starts phase one without fabricated personal history or messages', async () => {
    const data = await snapshot()
    expect(data.actor.role).toBe('mentor')
    expect(data.plans[0].phase).toBe(1)
    expect(data.checkins).toEqual([])
    expect(data.messages).toEqual([])
    expect(data.rewards).toEqual([])
    expect(data.profile!.name).toBe('Conan')
  })
  it('blocks outsiders and anonymous users through RLS and RPC permissions', async () => {
    await login('outsider')
    expect((await db.query('select * from profiles')).rows).toEqual([])
    await expect(snapshot()).rejects.toThrow('chưa được phép')
    await db.exec('reset role; set role anon;')
    await expect(snapshot()).rejects.toThrow('permission denied')
  })
  it('keeps the Dashboard automatic-RLS helper unavailable to API roles', async () => {
    const rows = (
      await db.query(
        "select role_name, has_function_privilege(role_name, 'public.rls_auto_enable()', 'EXECUTE') as can_execute from unnest(array['anon','authenticated','service_role']) as role_name",
      )
    ).rows
    expect(rows).toEqual([
      { role_name: 'anon', can_execute: false },
      { role_name: 'authenticated', can_execute: false },
      { role_name: 'service_role', can_execute: false },
    ])
  })
  it('does not expose the other family members in the allowlist', async () => {
    await login('learner')
    const rows = (await db.query('select email, role from memberships')).rows
    expect(rows).toEqual([{ email: 'learner@example.test', role: 'learner' }])
  })
  it('blocks direct table writes and role escalation even for a mentor', async () => {
    await expect(
      db.query("update memberships set role='mentor' where email='learner@example.test'"),
    ).rejects.toThrow('permission denied')
    await expect(
      db.query("insert into excused_days values('2026-10-14','Skip validation')"),
    ).rejects.toThrow('permission denied')
  })
  it('lets a learner save this week and prevents parent/future/old-week writes', async () => {
    await login('learner')
    await save('2026-10-12')
    expect((await snapshot()).checkins[0]).toMatchObject({
      date: '2026-10-12',
      habitId: 'grammar',
      status: 'done',
      version: 1,
      updatedBy: ids.learner,
    })
    await expect(save('2026-10-11')).rejects.toThrow('quyền')
    await expect(save('2026-10-15')).rejects.toThrow('quyền')
    await login('parent')
    await expect(save()).rejects.toThrow('chưa được phép')
    await login('mentor')
    await save('2026-10-11')
    await expect(save('2026-10-15')).rejects.toThrow('quyền')
  })
  it('rejects inactive habits, invalid minimum levels and stale creates/updates', async () => {
    await login('learner')
    await expect(save(day, 'review', 'done', 'Ôn bài')).rejects.toThrow('chưa được bật')
    await expect(save(day, 'anki', 'minimum')).rejects.toThrow('làm đủ')
    await expect(save(day, 'grammar', 'done', '', 9)).rejects.toThrow('chưa tồn tại')
    expect((await snapshot()).checkins).toEqual([])
    await save()
    await expect(save(day, 'grammar', 'minimum', '', 0)).rejects.toThrow('vừa được cập nhật')
    await save(day, 'grammar', 'extra', '', 1)
    expect((await snapshot()).checkins[0]).toMatchObject({ status: 'extra', version: 2 })
  })
  it('requires a short note for review and allows note correction with version checking', async () => {
    // Owner fixture makes phase 3 effective in the past, as a previously scheduled plan would be.
    await db.exec('reset role; update plan_versions set phase=3;')
    await login('learner')
    await expect(save(day, 'review', 'minimum', '   ')).rejects.toThrow('một dòng')
    await save(day, 'review', 'done', 'Sửa bài sai về phân số')
    await save(day, 'review', 'done', 'Sửa 3 bài sai về phân số', 1)
    await expect(save(day, 'review', 'done', 'Bản ghi cũ', 1)).rejects.toThrow('vừa được cập nhật')
    expect((await snapshot()).checkins[0].note).toBe('Sửa 3 bài sai về phân số')
  })
  it('preserves prior plan requirements and permits only future plan changes', async () => {
    const oldId = (await snapshot()).plans[0].id
    await save()
    const habits = defaultHabits()
    habits[0].target = 12
    await db.query('select save_plan($1::date,$2::smallint,$3::jsonb)', ['2026-10-15', 2, habits])
    const data = await snapshot()
    expect(data.plans[0].habits[0].target).toBe(10)
    expect(data.plans[1].habits[0].target).toBe(12)
    expect(data.checkins[0].planId).toBe(oldId)
    await expect(
      db.query('select save_plan($1::date,$2::smallint,$3::jsonb)', [day, 3, habits]),
    ).rejects.toThrow('ngày mai')
    habits[0].minimum = 20
    await expect(
      db.query('select save_plan($1::date,$2::smallint,$3::jsonb)', ['2026-10-16', 3, habits]),
    ).rejects.toThrow('không được vượt')
  })
  it('excuses a day without losing old records, and keeps granting leave mentor-only', async () => {
    await save()
    await db.query('select save_excuse($1::date,$2)', [day, 'Gia đình đi xa'])
    await login('learner')
    await expect(save(day, 'grammar', 'done', '', 1)).rejects.toThrow('cho nghỉ')
    expect((await snapshot()).checkins).toHaveLength(1)
    await expect(db.query('select save_excuse($1::date,$2)', [day, 'Tự cho nghỉ'])).rejects.toThrow(
      'chưa được phép',
    )
    await login('mentor')
    await db.query('select save_excuse($1::date,$2,true)', [day, ''])
    expect((await snapshot()).excuses).toHaveLength(0)
  })
  it('allows parent messages with server-assigned authors and prevents deleting someone else’s message', async () => {
    await db.query('select save_encouragement($1,$2)', ['Thầy ghi nhận em đã cố gắng.', null])
    const mentorMessage = (await snapshot()).messages[0]
    await login('parent')
    await db.query('select save_encouragement($1,$2)', ['Ba thấy con đã tự mở sách.', null])
    expect((await snapshot()).messages.find((m) => m.authorId === ids.parent)!.authorName).toBe(
      'Ba',
    )
    await expect(
      db.query('select delete_encouragement($1::uuid)', [mentorMessage.id]),
    ).rejects.toThrow('của mình')
    await login('learner')
    await expect(db.query('select save_encouragement($1,$2)', ['Giả mạo', null])).rejects.toThrow(
      'chưa được phép',
    )
  })
  it('keeps Google family assets private and restricts uploads to adults’ own folders', async () => {
    const path = `${ids.parent}/00000000-0000-4000-8000-000000000005.png`
    await login('parent')
    await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
      'family-assets',
      path,
    ])
    await expect(
      db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
        'family-assets',
        `${ids.mentor}/other.png`,
      ]),
    ).rejects.toThrow('row-level security')
    await login('learner')
    expect((await db.query('select name from storage.objects')).rows).toHaveLength(1)
    await expect(
      db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
        'family-assets',
        `${ids.learner}/photo.png`,
      ]),
    ).rejects.toThrow('row-level security')
    await login('outsider')
    expect((await db.query('select name from storage.objects')).rows).toEqual([])
    await db.exec('reset role;')
    expect((await db.query('select public from storage.buckets')).rows[0]).toMatchObject({
      public: false,
    })
  })
  it('rejects image paths that have not actually been uploaded', async () => {
    await expect(
      db.query('select save_profile($1,$2)', [
        'Conan',
        `${ids.mentor}/00000000-0000-4000-8000-000000000006.png`,
      ]),
    ).rejects.toThrow('chưa được tải')
    await expect(
      db.query('select save_profile($1,$2)', ['Conan', 'https://outside.example/photo.png']),
    ).rejects.toThrow('không hợp lệ')
  })
  it('keeps preferences learner/mentor-only and weekly reviews mentor-only', async () => {
    await login('learner')
    await db.query('select save_preferences($1,$2)', ['football', 'blue'])
    expect((await snapshot()).profile).toMatchObject({ avatar: 'football', accent: 'blue' })
    await login('parent')
    await expect(db.query('select save_preferences($1,$2)', ['football', 'blue'])).rejects.toThrow(
      'chưa được phép',
    )
    const review = {
      weekStart: '2026-10-12',
      praise: 'Đã tự đọc sách',
      adjustment: 'Đặt sách trên bàn',
      autonomy: 'less_reminding',
    }
    await expect(db.query('select save_weekly_review($1::jsonb)', [review])).rejects.toThrow(
      'chưa được phép',
    )
    await login('mentor')
    await db.query('select save_weekly_review($1::jsonb)', [review])
    expect((await snapshot()).reviews[0]).toEqual(review)
  })
  it('limits active goals to two and hides rewards until adults explicitly enable them', async () => {
    const makeGoal = () => ({
      id: crypto.randomUUID(),
      title: 'Tự nhớ đọc sách',
      description: '',
      imagePath: null,
      milestones: [
        { id: crypto.randomUUID(), title: 'Cùng nhìn lại', date: '2026-11-14', achieved: false },
      ],
    })
    await db.query('select save_goal($1::jsonb)', [makeGoal()])
    await db.query('select save_goal($1::jsonb)', [makeGoal()])
    await expect(db.query('select save_goal($1::jsonb)', [makeGoal()])).rejects.toThrow(
      'hai mục tiêu',
    )
    const reward = {
      id: crypto.randomUUID(),
      title: '',
      conditions: '',
      imagePath: null,
      visible: true,
      received: false,
    }
    await expect(db.query('select save_reward($1::jsonb)', [reward])).rejects.toThrow(
      'tên và điều kiện',
    )
    await db.query('select save_reward($1::jsonb)', [{ ...reward, visible: false }])
    await login('learner')
    await expect(db.query('select save_goal($1::jsonb)', [makeGoal()])).rejects.toThrow(
      'chưa được phép',
    )
    expect((await snapshot()).rewards).toEqual([])
    expect((await db.query('select * from rewards')).rows).toEqual([])
  })
  it('rejects incomplete JSON instead of leaving a broken profile or goal in the app', async () => {
    await expect(db.query('select save_preferences($1,$2)', [null, 'teal'])).rejects.toThrow(
      'chưa hợp lệ',
    )
    await expect(db.query('select save_profile($1,$2)', [null, null])).rejects.toThrow('Tên gọi')
    await expect(
      db.query('select save_reward($1::jsonb)', [
        { id: crypto.randomUUID(), title: '', conditions: '' },
      ]),
    ).rejects.toThrow('chưa hợp lệ')
    await expect(
      db.query('select save_goal($1::jsonb)', [
        { id: crypto.randomUUID(), title: 'Thiếu mốc', description: '' },
      ]),
    ).rejects.toThrow('từ 1 đến 6 mốc')
  })
})
