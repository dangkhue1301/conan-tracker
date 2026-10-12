import { beforeEach, describe, expect, it } from 'vitest'
import { DemoRepository, validateImage } from '../src/repository'
import { defaultHabits } from '../src/defaults'
import { planForDate } from '../src/domain'

let values: Map<string, string>
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value)
  },
}
const repo = (role: 'learner' | 'mentor' | 'parent') =>
  new DemoRepository(role, storage, () => '2026-10-14')
const check = {
  date: '2026-10-14',
  habitId: 'review' as const,
  status: 'done' as const,
  note: 'Ôn phân số',
  expectedVersion: 0,
}
beforeEach(() => {
  values = new Map()
})

describe('demo uses the same product rules', () => {
  it('requires a review note and preserves the confirmed note on reload', async () => {
    await expect(repo('learner').saveCheckin({ ...check, note: '  ' })).rejects.toThrow('một dòng')
    await repo('learner').saveCheckin(check)
    expect(
      (await repo('learner').load()).checkins.find(
        (c) => c.date === check.date && c.habitId === 'review',
      ),
    ).toMatchObject({ note: 'Ôn phân số', status: 'done', version: 1 })
  })
  it('rejects stale writes rather than silently overwriting another tab', async () => {
    await repo('learner').saveCheckin(check)
    await expect(repo('mentor').saveCheckin({ ...check, note: 'Bản khác' })).rejects.toThrow(
      'nơi khác',
    )
    expect(
      (await repo('learner').load()).checkins.find(
        (c) => c.date === check.date && c.habitId === 'review',
      )!.note,
    ).toBe('Ôn phân số')
  })
  it('enforces current-week, future-day, parent and excused-day restrictions', async () => {
    await expect(repo('learner').saveCheckin({ ...check, date: '2026-10-11' })).rejects.toThrow(
      'quyền',
    )
    await expect(repo('mentor').saveCheckin({ ...check, date: '2026-10-15' })).rejects.toThrow(
      'quyền',
    )
    await expect(repo('parent').saveCheckin(check)).rejects.toThrow('quyền')
    await repo('mentor').saveExcuse(check.date, 'Nghỉ do đi xa')
    await expect(repo('learner').saveCheckin(check)).rejects.toThrow('cho nghỉ')
  })
  it('keeps historical plans when a mentor adds future requirements', async () => {
    const before = await repo('mentor').load()
    const habits = defaultHabits()
    habits.find((h) => h.id === 'reading')!.target = 8
    await repo('mentor').savePlan({ effectiveFrom: '2026-10-15', phase: 3, habits })
    const after = await repo('mentor').load()
    expect(planForDate(after.plans, '2026-10-14')).toEqual(planForDate(before.plans, '2026-10-14'))
    expect(
      planForDate(after.plans, '2026-10-15')!.habits.find((h) => h.id === 'reading')!.target,
    ).toBe(8)
    await expect(
      repo('learner').savePlan({ effectiveFrom: '2026-10-15', phase: 3, habits }),
    ).rejects.toThrow('người hướng dẫn')
  })
  it('allows parents to encourage but not edit the learner profile, and learners cannot impersonate a parent', async () => {
    await repo('parent').saveMessage('Ba ghi nhận con đã tự mở sách.', null)
    const data = await repo('learner').load()
    expect(data.messages[0]).toMatchObject({ authorId: 'demo-parent', authorName: 'Ba mẹ' })
    await expect(repo('learner').saveMessage('Giả lời người lớn', null)).rejects.toThrow(
      'người lớn',
    )
    await expect(repo('parent').saveProfile('Tên khác', null)).rejects.toThrow('người hướng dẫn')
    await expect(repo('parent').savePreferences('football', 'blue')).rejects.toThrow('Conan')
  })
  it('keeps preferences between sessions and rejects unsupported or oversized photos', async () => {
    await repo('learner').savePreferences('football', 'violet')
    expect((await repo('mentor').load()).profile).toMatchObject({
      avatar: 'football',
      accent: 'violet',
    })
    expect(() => validateImage({ type: 'image/svg+xml', size: 100 } as File)).toThrow('JPG')
    expect(() => validateImage({ type: 'image/png', size: 6 * 1024 * 1024 } as File)).toThrow(
      '5 MB',
    )
  })
})
