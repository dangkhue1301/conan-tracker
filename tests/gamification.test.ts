import { describe, expect, it } from 'vitest'
import { defaultHabits } from '../src/defaults'
import { activeHabits, addDays, planForDate } from '../src/domain'
import {
  emptyGameState,
  gameState,
  gameStats,
  leagueBotFinalXp,
  leagueBotProgress,
  leagueEntries,
  LEAGUES,
  monthlyProgress,
  promotionSlots,
  streakCoinReward,
  streakMilestones,
} from '../src/gamification'
import { ARCHIVED_AVATAR_FRAMES, CATEGORY_LABELS, itemById, SHOP_ITEMS } from '../src/shop-catalog'
import type { GameState } from '../src/gamification-types'
import type { CheckinStatus, HabitId, Snapshot } from '../src/types'

function fixture(start = '2026-10-01', habits?: HabitId[]): Snapshot & { game: GameState } {
  return {
    actor: { id: 'learner', name: 'Conan', email: '', role: 'learner' },
    profile: {
      name: 'Conan',
      startedOn: start,
      avatar: 'detective',
      accent: 'teal',
      familyPhoto: null,
    },
    plans: [
      {
        id: 'plan',
        revision: 1,
        phase: 3,
        effectiveFrom: start,
        habits: defaultHabits().filter((habit) => !habits || habits.includes(habit.id)),
      },
    ],
    checkins: [],
    excuses: [],
    reviews: [],
    messages: [],
    goals: [],
    rewards: [],
    game: emptyGameState(),
  }
}

function credit(data: Snapshot, date: string, status: CheckinStatus = 'done', only?: HabitId[]) {
  const plan = planForDate(data.plans, date)
  for (const habit of activeHabits(plan)) {
    if (only && !only.includes(habit.id)) continue
    data.checkins.push({
      date,
      habitId: habit.id,
      status,
      note: habit.id === 'review' ? 'Ôn bài tập đã học' : '',
      planId: plan!.id,
      version: 1,
      updatedAt: `${date}T10:00:00Z`,
      updatedBy: 'learner',
    })
  }
}

describe('separate earning and spending systems', () => {
  it('awards minimum, full and extra points once, with a bonus only for a complete day', () => {
    const data = fixture()
    credit(data, '2026-10-01', 'minimum', ['anki', 'grammar', 'mental'])
    credit(data, '2026-10-01', 'done', ['review', 'reading'])
    credit(data, '2026-10-01', 'extra', ['writing'])
    credit(data, '2026-10-02', 'minimum')
    data.game.spentCoins = 70
    expect(gameStats(data, '2026-10-03')).toMatchObject({
      earnedCoins: 95,
      coins: 225,
      xp: 190,
      weeklyXp: 190,
      extraCount: 1,
    })
    data.game.spentCoins = 500
    expect(gameStats(data, '2026-10-03')).toMatchObject({ coins: 0, xp: 190 })
  })

  it('credits historical corrections to their original week and ignores pre-start, future and inactive checks', () => {
    const data = fixture('2026-10-01', ['anki'])
    credit(data, '2026-10-05', 'done')
    credit(data, '2026-10-12', 'minimum')
    credit(data, '2026-10-15', 'extra')
    data.checkins.push(
      { ...data.checkins[0], date: '2026-09-30' },
      { ...data.checkins[0], habitId: 'writing' },
    )
    expect(gameStats(data, '2026-10-14')).toMatchObject({
      earnedCoins: 35,
      coins: 235,
      xp: 70,
      weeklyXp: 30,
      extraCount: 0,
    })
    data.checkins[0].status = 'extra'
    expect(gameStats(data, '2026-10-14')).toMatchObject({
      earnedCoins: 40,
      xp: 80,
      weeklyXp: 30,
      extraCount: 1,
    })
  })

  it('rest days do not create points, and an undo offsets future earnings without reducing XP through purchases', () => {
    const data = fixture('2026-10-01', ['anki'])
    credit(data, '2026-10-01')
    data.game.spentCoins = 220
    expect(gameStats(data, '2026-10-02')).toMatchObject({ coins: 0, xp: 40 })
    data.checkins[0].status = 'not_started'
    credit(data, '2026-10-02', 'minimum')
    expect(gameStats(data, '2026-10-03')).toMatchObject({ earnedCoins: 15, coins: 0, xp: 30 })
    credit(data, '2026-10-03')
    expect(gameStats(data, '2026-10-04')).toMatchObject({ earnedCoins: 35, coins: 15, xp: 70 })
    data.excuses = [{ date: '2026-10-03', reason: 'Nghỉ đã duyệt' }]
    expect(gameStats(data, '2026-10-04')).toMatchObject({ earnedCoins: 15, coins: 0, xp: 30 })
    expect(data.game.inventory).toEqual(['frame-starter'])
  })

  it('does not count duplicate versions as multiple earned check-ins', () => {
    const data = fixture('2026-10-01', ['anki'])
    credit(data, '2026-10-01')
    data.checkins.unshift({ ...data.checkins[0], status: 'minimum', version: 0 })
    expect(gameStats(data, '2026-10-02')).toMatchObject({ earnedCoins: 20, xp: 40 })
    data.checkins.push({ ...data.checkins[1], status: 'not_started', version: 2 })
    expect(gameStats(data, '2026-10-02')).toMatchObject({ earnedCoins: 0, xp: 0 })
  })
})

describe('opening Coins, reset baselines and streak gifts', () => {
  it('starts a fresh wallet with 200 Coins and keeps XP separate', () => {
    expect(gameStats(fixture(), '2026-10-01')).toMatchObject({ coins: 200, earnedCoins: 0, xp: 0 })
  })

  it.each([
    [7, 100, 100],
    [10, 100, 200],
    [30, 150, 350],
    [60, 150, 500],
    [90, 150, 650],
    [120, 300, 950],
    [180, 300, 1250],
    [365, 300, 1550],
    [400, 300, 1850],
    [500, 300, 2150],
  ])('awards the %i-day gift once for the shared streak', (days, reward, total) => {
    const data = fixture('2025-01-01', ['anki', 'grammar'])
    for (let day = 0; day < days; day++) credit(data, addDays('2025-01-01', day))
    const date = addDays('2025-01-01', days - 1)
    expect(streakCoinReward(days)).toBe(reward)
    expect(gameStats(data, date)).toMatchObject({
      streakCoins: total,
      coins: 200 + days * 30 + total,
      xp: days * 60,
    })
    data.game.seenMilestones = streakMilestones(data, date).map((milestone) => milestone.key)
    expect(gameStats(data, date).streakCoins).toBe(total)
    expect(streakMilestones(data, date)).toEqual([])
  })

  it('does not repeat gifts when a broken streak is rebuilt, or reward a single habit alone', () => {
    const data = fixture('2026-10-01', ['anki', 'grammar'])
    for (let day = 0; day < 7; day++) credit(data, addDays('2026-10-01', day))
    for (let day = 8; day < 15; day++) credit(data, addDays('2026-10-01', day))
    expect(gameStats(data, '2026-10-15')).toMatchObject({ bestStreak: 7, streakCoins: 100 })
    const partial = fixture('2026-10-01', ['anki', 'grammar'])
    for (let day = 0; day < 10; day++) credit(partial, addDays('2026-10-01', day), 'done', ['anki'])
    expect(gameStats(partial, '2026-10-10')).toMatchObject({ bestStreak: 0, streakCoins: 0 })
  })

  it('excludes old work, credits new work and upgrades on the reset day, and reverses new work once', () => {
    const data = fixture('2026-10-01', ['anki', 'grammar', 'mental'])
    credit(data, '2026-10-01')
    credit(data, '2026-10-02', 'done', ['anki'])
    credit(data, '2026-10-02', 'minimum', ['grammar'])
    data.game.coinWallet = {
      openingCoins: 200,
      startedOn: '2026-10-02',
      baselineByHabit: { anki: 10, grammar: 5 },
      dayBonusBaseline: 0,
      streakBaseline: 1,
    }
    const before = gameStats(data, '2026-10-02')
    expect(before).toMatchObject({ coins: 200, earnedCoins: 0, xp: 110 })
    data.checkins[0].status = 'extra'
    expect(gameStats(data, '2026-10-02')).toMatchObject({ coins: 200, xp: 120 })
    credit(data, '2026-10-02', 'done', ['mental'])
    expect(gameStats(data, '2026-10-02').coins).toBe(220)
    data.checkins.find((check) => check.date === '2026-10-02' && check.habitId === 'anki')!.status =
      'extra'
    expect(gameStats(data, '2026-10-02').coins).toBe(225)
    data.checkins.find(
      (check) => check.date === '2026-10-02' && check.habitId === 'mental',
    )!.status = 'not_started'
    expect(gameStats(data, '2026-10-02').coins).toBe(205)
    credit(data, '2026-10-03')
    expect(gameStats(data, '2026-10-03').coins).toBe(245)
    expect(gameStats(JSON.parse(JSON.stringify(data)), '2026-10-03').coins).toBe(245)
  })

  it('excludes a completed reset day and already reached streak gifts', () => {
    const data = fixture('2026-10-01', ['anki'])
    for (let day = 0; day < 7; day++) credit(data, addDays('2026-10-01', day))
    data.game.coinWallet = {
      openingCoins: 200,
      startedOn: '2026-10-07',
      baselineByHabit: { anki: 10 },
      dayBonusBaseline: 10,
      streakBaseline: 7,
    }
    expect(gameStats(data, '2026-10-07')).toMatchObject({
      coins: 200,
      streakCoins: 0,
      bestStreak: 7,
    })
    for (let day = 7; day < 10; day++) credit(data, addDays('2026-10-01', day))
    expect(gameStats(data, '2026-10-10')).toMatchObject({
      coins: 360,
      streakCoins: 100,
      bestStreak: 10,
    })
  })
})

describe('streaks respect calendar history and approved exceptions', () => {
  it('bridges rest and approved repairs without increasing the streak, allowing today to remain unfinished', () => {
    const data = fixture('2026-10-01', ['anki'])
    credit(data, '2026-10-01')
    credit(data, '2026-10-03', 'minimum')
    credit(data, '2026-10-05', 'extra')
    data.excuses = [{ date: '2026-10-02', reason: 'Nghỉ' }]
    data.game.repairs = [
      {
        id: 'repair',
        date: '2026-10-04',
        reason: 'Quên',
        prevention: 'Đặt nhắc nhở',
        status: 'approved',
        createdAt: '2026-10-05T10:00:00Z',
      },
    ]
    expect(gameStats(data, '2026-10-06')).toMatchObject({
      currentStreak: 3,
      bestStreak: 3,
      perHabit: { anki: { current: 3, best: 3 } },
    })
    expect(gameStats(data, '2026-10-07')).toMatchObject({ currentStreak: 0, bestStreak: 3 })
    credit(data, '2026-10-06')
    expect(gameStats(data, '2026-10-07')).toMatchObject({ currentStreak: 4, bestStreak: 4 })
  })

  it('retains real work on a partially repaired day, rather than giving imaginary completion or points', () => {
    const data = fixture('2026-10-01', ['anki', 'grammar'])
    credit(data, '2026-10-01')
    credit(data, '2026-10-02', 'done', ['anki'])
    credit(data, '2026-10-03')
    data.game.repairs = [
      {
        id: 'repair',
        date: '2026-10-02',
        reason: 'Quên',
        prevention: 'Đặt nhắc nhở',
        status: 'approved',
        createdAt: '2026-10-03T10:00:00Z',
      },
    ]
    expect(gameStats(data, '2026-10-04')).toMatchObject({
      currentStreak: 2,
      earnedCoins: 70,
      xp: 140,
      perHabit: { anki: { current: 3, best: 3 }, grammar: { current: 2, best: 2 } },
    })
    data.game.repairs[0].status = 'pending'
    expect(gameStats(data, '2026-10-04')).toMatchObject({
      currentStreak: 1,
      perHabit: { anki: { current: 3, best: 3 }, grammar: { current: 1, best: 1 } },
    })
  })

  it('uses the actual phase on each date and starts later habits without penalizing earlier phases', () => {
    const data = fixture('2026-10-01')
    data.plans[0].phase = 1
    data.plans.push({
      ...structuredClone(data.plans[0]),
      id: 'phase3',
      effectiveFrom: '2026-10-03',
      phase: 3,
    })
    for (let i = 0; i < 3; i++) credit(data, addDays('2026-10-01', i))
    expect(gameStats(data, '2026-10-04')).toMatchObject({
      currentStreak: 3,
      perHabit: { anki: { current: 3 }, writing: { current: 1 }, review: { current: 1 } },
    })
  })

  it('does not invent streaks for an empty profile or before the start date', () => {
    const data = fixture('2026-10-01')
    expect(gameStats(data, '2026-09-30')).toMatchObject({ currentStreak: 0, xp: 0 })
    data.profile = null
    expect(gameStats(data, '2026-10-05')).toMatchObject({ currentStreak: 0, bestStreak: 0, xp: 0 })
  })
})

it('keeps best-streak gates and owned cosmetics after losing a streak or resting today', () => {
  const data = fixture('2026-10-01', ['anki'])
  for (let day = 0; day < 10; day++) credit(data, addDays('2026-10-01', day))
  data.game.inventory.push('frame-flame-2')
  data.game.equipped.frame = 'frame-flame-2'
  data.excuses = [{ date: '2026-10-11', reason: 'Ngày nghỉ' }]
  expect(gameStats(data, '2026-10-11')).toMatchObject({ currentStreak: 10, bestStreak: 10 })
  expect(gameStats(data, '2026-10-13')).toMatchObject({ currentStreak: 0, bestStreak: 10 })
  expect(gameState(data).inventory).toContain('frame-flame-2')
  expect(gameState(data).equipped.frame).toBe('frame-flame-2')
})

describe('monthly prize entitlement', () => {
  it('requires a complete calendar month, including leap day, and waits for the month to end', () => {
    const data = fixture('2028-02-01', ['anki'])
    for (let day = 0; day < 29; day++) credit(data, addDays('2028-02-01', day), 'minimum')
    expect(monthlyProgress(data, '2028-02', '2028-02-29')).toMatchObject({
      eligible: false,
      completed: 29,
      total: 29,
      ended: false,
    })
    expect(monthlyProgress(data, '2028-02', '2028-03-01')).toMatchObject({
      eligible: true,
      completed: 29,
      total: 29,
      ended: true,
    })
    data.checkins = data.checkins.filter((check) => check.date !== '2028-02-29')
    expect(monthlyProgress(data, '2028-02', '2028-03-01')).toMatchObject({
      eligible: false,
      completed: 28,
    })
  })

  it('accepts approved rest and one approved repair, while rejecting a partial starting month', () => {
    const data = fixture('2026-09-01', ['anki'])
    for (let day = 0; day < 30; day++)
      if (![9, 10].includes(day)) credit(data, addDays('2026-09-01', day))
    data.excuses = [{ date: '2026-09-10', reason: 'Nghỉ gia đình' }]
    data.game.repairs = [
      {
        id: 'r',
        date: '2026-09-11',
        reason: 'Quên',
        prevention: 'Nhắc nhở',
        status: 'approved',
        createdAt: '2026-09-12T10:00:00Z',
      },
    ]
    expect(monthlyProgress(data, '2026-09', '2026-10-01')).toMatchObject({
      eligible: true,
      completed: 30,
      total: 30,
    })
    data.profile!.startedOn = '2026-09-02'
    expect(monthlyProgress(data, '2026-09', '2026-10-01')).toMatchObject({
      eligible: false,
      completed: 29,
    })
  })

  it('does not honor multiple monthly repair approvals in a malformed snapshot', () => {
    const data = fixture('2026-09-01', ['anki'])
    for (let day = 0; day < 30; day++)
      if (![9, 10].includes(day)) credit(data, addDays('2026-09-01', day))
    data.game.repairs = [9, 10].map((offset) => ({
      id: `r${offset}`,
      date: addDays('2026-09-01', offset),
      reason: 'Quên',
      prevention: 'Nhắc nhở',
      status: 'approved',
      createdAt: `2026-09-${offset + 2}T10:00:00Z`,
    }))
    expect(monthlyProgress(data, '2026-09', '2026-10-01')).toMatchObject({
      eligible: false,
      completed: 29,
    })
    expect(monthlyProgress(data, '2026-13', '2026-10-01')).toMatchObject({
      eligible: false,
      total: 0,
    })
    expect(monthlyProgress(data, '2026-09', 'not-a-date')).toMatchObject({
      eligible: false,
      total: 0,
    })
  })
})

describe('permanent milestones and catalog', () => {
  it('emits global and per-habit milestones through 365 then every 100, with permanent receipts', () => {
    const data = fixture('2025-01-01', ['anki'])
    for (let day = 0; day < 400; day++) credit(data, addDays('2025-01-01', day))
    const date = addDays('2025-01-01', 400)
    const milestones = streakMilestones(data, date)
    expect(
      milestones.filter((milestone) => !milestone.habitId).map((milestone) => milestone.count),
    ).toEqual([400, 365, 180, 120, 90, 60, 30, 10, 7])
    expect(milestones).toHaveLength(18)
    data.game.seenMilestones = milestones.map((milestone) => milestone.key)
    expect(streakMilestones(data, addDays(date, 10))).toEqual([])
  })

  it('keeps 58 active purchases and archives all 31 generated avatar frames', () => {
    expect(SHOP_ITEMS).toHaveLength(58)
    expect(new Set(SHOP_ITEMS.map((item) => item.id)).size).toBe(58)
    expect(SHOP_ITEMS.filter((item) => item.price > 0)).toHaveLength(58)
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(5)
    expect(SHOP_ITEMS.filter((item) => item.category === 'frame')).toHaveLength(22)
    expect(itemById('frame-mist-swordsman')).toMatchObject({
      price: 4000,
      streakRequired: 40,
      theme: 'mist',
    })
    expect(ARCHIVED_AVATAR_FRAMES).toHaveLength(31)
    for (const frame of ARCHIVED_AVATAR_FRAMES) expect(itemById(frame.id)).toBeUndefined()
    expect(ARCHIVED_AVATAR_FRAMES.find((item) => item.id === 'frame-flame-5')).toMatchObject({
      price: 8500,
      streakRequired: 100,
      extraRequired: 50,
    })
    expect(ARCHIVED_AVATAR_FRAMES.find((item) => item.id === 'frame-starter')).toMatchObject({
      price: 0,
    })
    expect(itemById('weapon-fire-1')).toBeUndefined()
    expect(itemById(undefined)).toBeUndefined()
    expect(itemById('unknown')).toBeUndefined()
  })

  it('merges legacy snapshots with fresh defaults without mutating inventory or losing purchases', () => {
    const data = fixture()
    data.game.inventory = ['frame-flame-2']
    data.game.equipped.frame = 'frame-flame-2'
    const state = gameState(data)
    expect(state.inventory).toEqual(['frame-starter', 'frame-flame-2'])
    expect(data.game.inventory).toEqual(['frame-flame-2'])
    expect(state.equipped.frame).toBe('frame-flame-2')
    delete (data as Snapshot).game
    expect(gameState(data)).toEqual(emptyGameState())
  })
})

it('respects explicitly unequipped cosmetics instead of restoring a starter frame', () => {
  const data = fixture()
  data.game.equipped = {}
  expect(gameState(data).equipped).toEqual({})
  expect(gameState(data).inventory).toContain('frame-starter')
})

describe('stable fictional leagues', () => {
  it('uses all ten leagues with the agreed promotion bands and deterministic final scores', () => {
    expect(LEAGUES).toHaveLength(10)
    expect(LEAGUES[9]).toBe('Diamond')
    expect(Array.from({ length: 10 }, (_, i) => promotionSlots(i))).toEqual([
      20, 15, 10, 7, 7, 7, 7, 7, 5, 0,
    ])
    expect(leagueBotFinalXp('2026-10-12', 0, 0)).toBe(leagueBotFinalXp('2026-10-12', 0, 0))
    // Seven habits at the extra level earn 1,610 XP in a full week. First place
    // must remain attainable by actual work, including in Diamond.
    for (let week = 0; week < 52; week++)
      for (let tier = 0; tier < 10; tier++)
        for (let bot = 0; bot < 29; bot++)
          expect(leagueBotFinalXp(addDays('2026-01-05', week * 7), tier, bot)).toBeLessThan(1610)
  })

  it('raises every opponent across all ten tiers and keeps a full-work week capable of winning', () => {
    for (let offset = 0; offset < 52; offset++) {
      const week = addDays('2026-10-12', offset * 7)
      let bronzeTotal = 0,
        diamondTotal = 0
      for (let bot = 0; bot < 29; bot++) {
        let previous = 0
        for (let tier = 0; tier < 10; tier++) {
          const xp = leagueBotFinalXp(week, tier, bot)
          expect(xp).toBeGreaterThan(previous)
          expect(xp).toBeLessThanOrEqual(1580)
          previous = xp
        }
        bronzeTotal += leagueBotFinalXp(week, 0, bot)
        diamondTotal += leagueBotFinalXp(week, 9, bot)
      }
      expect(diamondTotal).toBeGreaterThan(bronzeTotal * 2)
    }
  })

  it('preserves scores from seasons before the new competition rules', () => {
    expect(
      Array.from({ length: 6 }, (_, i) =>
        leagueBotFinalXp('2026-10-05', 0, [0, 3, 7, 14, 23, 28][i]),
      ),
    ).toEqual([1204, 892, 828, 558, 270, 274])
  })

  it('earns XP in independent short sessions and keeps progressing while the page is closed', () => {
    const start = Date.parse('2026-10-14T05:00:00Z')
    const scores = (minute: number) =>
      Array.from({ length: 29 }, (_, index) =>
        leagueBotProgress('2026-10-12', 9, index, new Date(start + minute * 60000)),
      )
    let previous = scores(0),
      changingMinutes = 0
    for (let minute = 1; minute <= 120; minute++) {
      const next = scores(minute)
      const changed = next.filter((bot, index) => bot.xp > previous[index].xp).length
      if (changed > 0) changingMinutes++
      expect(changed).toBeLessThan(29)
      for (let i = 0; i < next.length; i++) {
        expect(next[i].xp).toBeGreaterThanOrEqual(previous[i].xp)
        expect(next[i].recentXp).toBeGreaterThanOrEqual(0)
      }
      previous = next
    }
    expect(changingMinutes).toBeGreaterThan(50)
    expect(scores(120)).toEqual(previous)
    expect(previous.some((bot, index) => bot.xp > scores(0)[index].xp)).toBe(true)
    expect(previous.some((bot) => bot.active)).toBe(true)
  })

  it('never drops at midnight and reaches the exact settlement score by the week boundary', () => {
    const start = Date.parse('2026-10-12T00:00:00+07:00')
    for (let tier = 0; tier < 10; tier++)
      for (let bot = 0; bot < 29; bot++) {
        let previous = 0
        for (const minute of [0, 1439, 1440, 2879, 2880, 8639, 8640, 10079, 10080, 10110]) {
          const progress = leagueBotProgress(
            '2026-10-12',
            tier,
            bot,
            new Date(start + minute * 60000),
          )
          expect(progress.xp).toBeGreaterThanOrEqual(previous)
          expect(progress.xp).toBeLessThanOrEqual(leagueBotFinalXp('2026-10-12', tier, bot))
          previous = progress.xp
          if (minute >= 10079) {
            expect(progress.xp).toBe(leagueBotFinalXp('2026-10-12', tier, bot))
            expect(progress.active).toBe(false)
          }
        }
      }
    const data = fixture('2026-10-12', ['anki'])
    const before = leagueEntries(data, '2026-10-14', new Date('2026-10-14T16:59:00Z'))
    const after = leagueEntries(data, '2026-10-14', new Date('2026-10-14T17:00:00Z'))
    for (const bot of before.filter((entry) => !entry.isConan))
      expect(after.find((entry) => entry.id === bot.id)!.xp).toBeGreaterThanOrEqual(bot.xp)
  })

  it('creates exactly 29 stable invented profiles and one highlighted Conan without adapting bots to his XP', () => {
    const data = fixture('2026-10-12', ['anki'])
    const time = new Date('2026-10-14T08:00:00Z')
    const before = leagueEntries(data, '2026-10-14', time)
    credit(data, '2026-10-14', 'extra')
    const after = leagueEntries(data, '2026-10-14', time)
    expect(after).toHaveLength(30)
    expect(after.filter((entry) => entry.isConan)).toHaveLength(1)
    expect(after.map((entry) => entry.rank)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    for (const bot of before.filter((entry) => !entry.isConan))
      expect(after.find((entry) => entry.id === bot.id)).toMatchObject({
        name: bot.name,
        country: bot.country,
        avatarSeed: bot.avatarSeed,
        frameId: bot.frameId,
        xp: bot.xp,
      })
    expect(after.find((entry) => entry.isConan)?.xp).toBe(50)
  })

  it('follows a monotonic predetermined schedule within a week and awards ties to bots consistently with SQL', () => {
    const data = fixture('2026-10-12', ['anki'])
    const early = leagueEntries(data, '2026-10-12', new Date('2026-10-11T17:00:00Z'))
    expect(early.find((entry) => entry.isConan)?.rank).toBe(30)
    const middle = leagueEntries(data, '2026-10-14', new Date('2026-10-14T05:00:00Z'))
    const later = leagueEntries(data, '2026-10-18', new Date('2026-10-18T12:00:00Z'))
    for (const bot of middle.filter((entry) => !entry.isConan))
      expect(later.find((entry) => entry.id === bot.id)!.xp).toBeGreaterThanOrEqual(bot.xp)
  })
})
