import { describe, expect, it } from 'vitest'
import {
  activeHabits,
  addDays,
  canEdit,
  hasMinimum,
  planForDate,
  safeUrl,
  today,
  validateHabits,
  weekStart,
  weeklyStats,
} from '../src/domain'
import { defaultHabits } from '../src/defaults'
import { demoSnapshot } from '../src/repository'
import type { Plan, Snapshot } from '../src/types'

function fixture(): Snapshot {
  const data = demoSnapshot('learner', '2026-10-14')
  data.profile!.startedOn = '2026-10-12'
  data.plans = [{ id: 'p1', effectiveFrom: '2026-10-12', phase: 1, habits: defaultHabits() }]
  data.checkins = []
  data.excuses = []
  return data
}

describe('Vietnamese calendar and edit window', () => {
  it('uses Vietnam midnight rather than the device timezone', () => {
    expect(today(new Date('2026-10-11T16:59:59Z'))).toBe('2026-10-11')
    expect(today(new Date('2026-10-11T17:00:00Z'))).toBe('2026-10-12')
  })
  it('keeps Monday–Sunday weeks across a year boundary', () => {
    expect(weekStart('2027-01-03')).toBe('2026-12-28')
    expect(weekStart('2027-01-04')).toBe('2027-01-04')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('allows learners to correct this week and mentors to correct history, never the future', () => {
    expect(canEdit('learner', '2026-10-12', '2026-10-14')).toBe(true)
    expect(canEdit('learner', '2026-10-11', '2026-10-14')).toBe(false)
    expect(canEdit('mentor', '2026-10-11', '2026-10-14')).toBe(true)
    expect(canEdit('mentor', '2026-10-15', '2026-10-14')).toBe(false)
    expect(canEdit('parent', '2026-10-14', '2026-10-14')).toBe(false)
  })
})

describe('versioned requirements and honest progress', () => {
  it('adds writing and review only from their plan effective dates', () => {
    const plans: Plan[] = [
      { id: 'p3', effectiveFrom: '2026-10-20', phase: 3, habits: defaultHabits() },
      { id: 'p1', effectiveFrom: '2026-10-12', phase: 1, habits: defaultHabits() },
      { id: 'p2', effectiveFrom: '2026-10-16', phase: 2, habits: defaultHabits() },
    ]
    expect(activeHabits(planForDate(plans, '2026-10-15'))).toHaveLength(4)
    expect(activeHabits(planForDate(plans, '2026-10-16'))).toHaveLength(5)
    expect(activeHabits(planForDate(plans, '2026-10-20'))).toHaveLength(6)
    expect(planForDate(plans, '2026-10-11')).toBeUndefined()
  })
  it('counts a minimum, full or extra attempt once and keeps the full-week denominator', () => {
    const data = fixture()
    data.checkins = (['minimum', 'done', 'extra'] as const).map((status, i) => ({
      date: '2026-10-12',
      habitId: ['grammar', 'mental', 'reading'][i] as 'grammar' | 'mental' | 'reading',
      status,
      note: '',
      planId: 'p1',
      version: 1,
      updatedAt: '',
      updatedBy: 'learner',
    }))
    const stats = weeklyStats(data, '2026-10-12', '2026-10-14')
    expect(stats).toMatchObject({
      planned: 28,
      credited: 3,
      minimum: 1,
      done: 1,
      extra: 1,
      missed: 5,
      rate: 11,
      target: 23,
      ended: false,
    })
  })
  it('excludes excused days without deleting their check-ins', () => {
    const data = fixture()
    data.excuses = [{ date: '2026-10-13', reason: 'Gia đình đi xa' }]
    data.checkins = [
      {
        date: '2026-10-13',
        habitId: 'anki',
        status: 'done',
        note: '',
        planId: 'p1',
        version: 1,
        updatedAt: '',
        updatedBy: 'learner',
      },
    ]
    expect(weeklyStats(data, '2026-10-12', '2026-10-14')).toMatchObject({
      planned: 24,
      credited: 0,
      missed: 4,
    })
    expect(data.checkins).toHaveLength(1)
  })
  it('does not call today or future days missed, and starts counting on the chosen start date', () => {
    const data = fixture()
    data.profile!.startedOn = '2026-10-14'
    expect(weeklyStats(data, '2026-10-12', '2026-10-14')).toMatchObject({
      planned: 20,
      missed: 0,
      ended: false,
    })
    data.excuses = Array.from({ length: 5 }, (_, i) => ({
      date: addDays('2026-10-14', i),
      reason: 'Nghỉ',
    }))
    expect(weeklyStats(data, '2026-10-12', '2026-10-19')).toMatchObject({
      planned: 0,
      rate: null,
      target: 0,
      ended: true,
    })
  })
  it('preserves old thresholds and calculates mixed-phase weeks per day', () => {
    const data = fixture(),
      newHabits = defaultHabits()
    newHabits[0].target = 12
    data.plans.push({ id: 'p2', effectiveFrom: '2026-10-15', phase: 3, habits: newHabits })
    expect(planForDate(data.plans, '2026-10-14')!.habits[0].target).toBe(10)
    expect(planForDate(data.plans, '2026-10-15')!.habits[0].target).toBe(12)
    expect(weeklyStats(data, '2026-10-12', '2026-10-14').planned).toBe(3 * 4 + 4 * 6)
  })
  it('never gives more than 100% for extra work', () => {
    const data = fixture()
    for (let d = 0; d < 7; d++)
      for (const habit of activeHabits(data.plans[0]))
        data.checkins.push({
          date: addDays('2026-10-12', d),
          habitId: habit.id,
          status: 'extra',
          note: '',
          planId: 'p1',
          version: 1,
          updatedAt: '',
          updatedBy: 'learner',
        })
    expect(weeklyStats(data, '2026-10-12', '2026-10-19')).toMatchObject({
      planned: 28,
      credited: 28,
      extra: 28,
      rate: 100,
    })
  })
})

describe('configuration constraints', () => {
  it('has a single Anki threshold and rejects a minimum above the full target', () => {
    const habits = defaultHabits()
    expect(validateHabits(habits)).toBeNull()
    expect(hasMinimum(habits.find((h) => h.id === 'anki')!)).toBe(false)
    habits.find((h) => h.id === 'grammar')!.minimum = 31
    expect(validateHabits(habits)).toContain('không vượt')
  })
  it('rejects executable links, duplicate habits and invalid times', () => {
    expect(safeUrl('javascript:alert(1)')).toBe(false)
    expect(safeUrl('https://example.com/reading')).toBe(true)
    const habits = defaultHabits()
    habits[0].schedule['7'].time = '25:00'
    expect(validateHabits(habits)).toContain('giờ')
    habits[0] = structuredClone(habits[1])
    expect(validateHabits(habits)).toContain('sáu')
  })
})
