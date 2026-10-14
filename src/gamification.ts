import {
  activeHabits,
  addDays,
  habitTitle,
  isCredited,
  planForDate,
  today,
  weekday,
  weekStart,
} from './domain'
import type { GameState } from './gamification-types'
import type { Checkin, HabitId, Snapshot } from './types'

const HABITS: HabitId[] = ['anki', 'grammar', 'mental', 'review', 'reading', 'writing', 'tidy']
const POINTS = { not_started: [0, 0], minimum: [5, 10], done: [10, 20], extra: [15, 30] } as const

export function emptyGameState(): GameState {
  return {
    avatarPath: null,
    inventory: ['frame-starter'],
    equipped: { frame: 'frame-starter' },
    spentCoins: 0,
    repairs: [],
    prizeCatalog: [],
    prizeRequests: [],
    seenMilestones: [],
    readMessageIds: [],
    league: { tier: 0, joinedWeek: null, history: [] },
  }
}

export function gameState(data: Snapshot): GameState {
  const base = emptyGameState()
  const saved = (data as Snapshot & { game?: GameState }).game
  if (!saved) return base
  return {
    ...base,
    ...saved,
    inventory: [...new Set(['frame-starter', ...(saved.inventory ?? [])])],
    equipped: saved.equipped === undefined ? { ...base.equipped } : { ...saved.equipped },
    spentCoins: Number.isFinite(saved.spentCoins) ? Math.max(0, saved.spentCoins) : 0,
    repairs: saved.repairs ?? [],
    prizeCatalog: saved.prizeCatalog ?? [],
    prizeRequests: saved.prizeRequests ?? [],
    seenMilestones: saved.seenMilestones ?? [],
    readMessageIds: saved.readMessageIds ?? [],
    league: {
      ...base.league,
      ...saved.league,
      tier: Math.max(0, Math.min(9, Math.floor(saved.league?.tier ?? 0))),
      history: saved.league?.history ?? [],
    },
  }
}

function isDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
  )
}

function historyStart(data: Snapshot): string | null {
  if (!data.profile || !isDate(data.profile.startedOn)) return null
  return data.profile.startedOn
}

function checkinIndex(data: Snapshot): Map<string, Checkin> {
  const checks = new Map<string, Checkin>()
  for (const check of data.checkins) {
    const key = `${check.date}:${check.habitId}`
    if ((checks.get(key)?.version ?? -1) <= check.version) checks.set(key, check)
  }
  return checks
}

function repairDates(data: Snapshot): Set<string> {
  // A repair is a bridge, never a fabricated check-in. The server enforces one
  // approved missed day per calendar month; this also tolerates older snapshots.
  const approved = gameState(data)
    .repairs.filter((repair) => repair.status === 'approved' && isDate(repair.date))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.date.localeCompare(b.date))
  const months = new Set<string>()
  const dates = new Set<string>()
  for (const repair of approved) {
    const month = repair.date.slice(0, 7)
    if (months.has(month)) continue
    months.add(month)
    dates.add(repair.date)
  }
  return dates
}

export interface GameStats {
  earnedCoins: number
  coins: number
  xp: number
  weeklyXp: number
  extraCount: number
  currentStreak: number
  bestStreak: number
  perHabit: Record<HabitId, { current: number; best: number }>
}

export function gameStats(data: Snapshot, currentDate = today()): GameStats {
  const result: GameStats = {
    earnedCoins: 0,
    coins: 0,
    xp: 0,
    weeklyXp: 0,
    extraCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    perHabit: Object.fromEntries(
      HABITS.map((id) => [id, { current: 0, best: 0 }]),
    ) as GameStats['perHabit'],
  }
  const start = historyStart(data)
  if (!start || !isDate(currentDate) || start > currentDate) return result
  const checks = checkinIndex(data)
  const rest = new Set(data.excuses.map((excuse) => excuse.date))
  const repairs = repairDates(data)
  const week = weekStart(currentDate)
  for (let date = start; date <= currentDate; date = addDays(date, 1)) {
    if (rest.has(date)) continue
    const habits = activeHabits(planForDate(data.plans, date))
    if (!habits.length) continue
    let complete = true
    let dayXp = 0
    for (const habit of habits) {
      const status = checks.get(`${date}:${habit.id}`)?.status ?? 'not_started'
      const streak = result.perHabit[habit.id]
      if (isCredited(status)) {
        const [coin, xp] = POINTS[status]
        result.earnedCoins += coin
        result.xp += xp
        dayXp += xp
        if (status === 'extra') result.extraCount++
        streak.current++
        streak.best = Math.max(streak.best, streak.current)
      } else {
        complete = false
        if (date < currentDate && !repairs.has(date)) streak.current = 0
      }
    }
    if (complete) {
      result.earnedCoins += 10
      result.xp += 20
      dayXp += 20
      result.currentStreak++
      result.bestStreak = Math.max(result.bestStreak, result.currentStreak)
    } else if (date < currentDate && !repairs.has(date)) result.currentStreak = 0
    if (date >= week) result.weeklyXp += dayXp
  }
  result.coins = Math.max(0, result.earnedCoins - gameState(data).spentCoins)
  return result
}

export interface MonthlyProgress {
  eligible: boolean
  completed: number
  total: number
  ended: boolean
  reason: string
}

export function monthlyProgress(
  data: Snapshot,
  month: string,
  currentDate = today(),
): MonthlyProgress {
  const invalid: MonthlyProgress = {
    eligible: false,
    completed: 0,
    total: 0,
    ended: false,
    reason: 'Tháng không hợp lệ.',
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !isDate(`${month}-01`) || !isDate(currentDate))
    return invalid
  const first = `${month}-01`
  const next = new Date(`${first}T12:00:00Z`)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const last = addDays(next.toISOString().slice(0, 10), -1)
  const total = Number(last.slice(8, 10))
  const ended = last < currentDate
  const start = historyStart(data)
  const checks = checkinIndex(data)
  const rest = new Set(data.excuses.map((excuse) => excuse.date))
  const repairs = repairDates(data)
  let completed = 0
  for (let date = first; date <= last && date <= currentDate; date = addDays(date, 1)) {
    if (!start || date < start) continue
    if (rest.has(date) || repairs.has(date)) {
      completed++
      continue
    }
    const habits = activeHabits(planForDate(data.plans, date))
    if (
      habits.length &&
      habits.every((habit) => isCredited(checks.get(`${date}:${habit.id}`)?.status))
    )
      completed++
  }
  const fullMonth = !!start && start <= first
  const eligible = ended && fullMonth && completed === total
  const reason = !start
    ? 'Chưa có hồ sơ học tập.'
    : !fullMonth
      ? 'Tháng bắt đầu chưa trọn vẹn; tính từ tháng kế tiếp.'
      : !ended
        ? 'Tháng vẫn đang diễn ra.'
        : completed !== total
          ? `Còn ${total - completed} ngày chưa đủ điều kiện.`
          : 'Đã duy trì trọn tháng. Em có thể chọn một món quà!'
  return { eligible, completed, total, ended, reason }
}

export interface StreakMilestone {
  key: string
  label: string
  count: number
  habitId?: HabitId
}

export function streakMilestones(data: Snapshot, currentDate = today()): StreakMilestone[] {
  const stats = gameStats(data, currentDate)
  const seen = new Set(gameState(data).seenMilestones)
  const thresholds = (best: number) =>
    [
      7,
      10,
      30,
      60,
      100,
      180,
      365,
      ...Array.from({ length: Math.max(0, Math.floor(best / 100) - 3) }, (_, i) => (i + 4) * 100),
    ].filter((n) => n <= best)
  const result: StreakMilestone[] = thresholds(stats.bestStreak).map((count) => ({
    key: `global:${count}`,
    label: 'Chuỗi thói quen',
    count,
  }))
  for (const id of HABITS) {
    const habit = [...data.plans]
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
      .flatMap((plan) => plan.habits)
      .find((item) => item.id === id)
    for (const count of thresholds(stats.perHabit[id].best))
      result.push({
        key: `${id}:${count}`,
        label: habit ? habitTitle(habit) : id,
        count,
        habitId: id,
      })
  }
  return result
    .filter((milestone) => !seen.has(milestone.key))
    .sort(
      (a, b) =>
        b.count - a.count ||
        Number(!!a.habitId) - Number(!!b.habitId) ||
        a.key.localeCompare(b.key),
    )
}

export const LEAGUES = [
  'Bronze',
  'Silver',
  'Gold',
  'Sapphire',
  'Ruby',
  'Emerald',
  'Amethyst',
  'Pearl',
  'Obsidian',
  'Diamond',
] as const
export function promotionSlots(tier: number): number {
  return [20, 15, 10, 7, 7, 7, 7, 7, 5, 0][Math.max(0, Math.min(9, Math.floor(tier)))]
}

/** Deliberately shared with SQL: bigint-safe ASCII hash, deterministic per week. */
export function leagueHash(text: string): number {
  let seed = 7
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) % 2147483647
  return seed
}

export function leagueBotFinalXp(week: string, tier: number, index: number): number {
  const level = Math.max(0, Math.min(9, Math.floor(tier)))
  const seed = leagueHash(`${week}:${level}:${index}`)
  const raw =
    index < 3
      ? 1350 + (seed % 201)
      : index < 7
        ? 980 + (seed % 201)
        : index < 14
          ? 700 + (seed % 351)
          : index < 23
            ? 350 + (seed % 451)
            : 100 + (seed % 351)
  return Math.floor((raw * (765 + level * 15)) / 900)
}

const BOT_PROFILES = [
  ['Aki Tanaka', 'JP'],
  ['Leo Martin', 'FR'],
  ['Minh Phan', 'VN'],
  ['Noah Brooks', 'GB'],
  ['Sofia Costa', 'BR'],
  ['Luca Moretti', 'IT'],
  ['Hana Kim', 'KR'],
  ['Ethan Reed', 'US'],
  ['Maya Patel', 'IN'],
  ['Felix Weber', 'DE'],
  ['Linh Nguyen', 'VN'],
  ['Yuna Sato', 'JP'],
  ['Oliver Lee', 'AU'],
  ['Amira Hassan', 'EG'],
  ['Mateo Ruiz', 'ES'],
  ['Ella Andersson', 'SE'],
  ['Arjun Shah', 'IN'],
  ['Chloe Dubois', 'CA'],
  ['Rafael Silva', 'PT'],
  ['Mei Chen', 'TW'],
  ['Kai Wilson', 'NZ'],
  ['Nora Berg', 'NO'],
  ['Diego Torres', 'MX'],
  ['Zara Khan', 'PK'],
  ['Theo Muller', 'CH'],
  ['An Nguyen', 'VN'],
  ['Nina Kowalska', 'PL'],
  ['Adam Novak', 'CZ'],
  ['Sari Putri', 'ID'],
] as const

export interface LeagueEntry {
  id: string
  name: string
  country: string
  avatarSeed: number
  frameId: string
  xp: number
  isConan: boolean
  rank: number
}

export function leagueEntries(data: Snapshot, date = today(), atTime = new Date()): LeagueEntry[] {
  const state = gameState(data)
  const week = weekStart(date)
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(atTime)
  const hour = Number(timeParts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(timeParts.find((part) => part.type === 'minute')?.value ?? 0)
  const fullDays = weekday(date) - 1
  // Calculate checkpoints from integer minutes: floating point fractions such
  // as 2 + 1/3 must not accidentally delay the 08:00 tick until 08:01.
  const todayFraction = Math.floor((hour * 60 + minute) / 240) / 6
  const entries: LeagueEntry[] = BOT_PROFILES.map(([name, country], i) => {
    const seed = leagueHash(`${week}:${state.league.tier}:${i}`)
    // Each bot follows a fixed daily schedule. No value depends on Conan's score.
    const weights = Array.from({ length: 7 }, (_, day) => 70 + ((seed + day * 37) % 61))
    const worked =
      weights.slice(0, fullDays).reduce((sum, weight) => sum + weight, 0) +
      (weights[fullDays] ?? 0) * todayFraction
    return {
      id: `bot-${i}`,
      name,
      country,
      avatarSeed: seed,
      frameId: `frame-${['flame', 'football', 'detective', 'manga', 'builder', 'space'][seed % 6]}-${1 + (seed % 5)}`,
      xp: Math.floor(
        (leagueBotFinalXp(week, state.league.tier, i) * worked) /
          weights.reduce((sum, weight) => sum + weight, 0),
      ),
      isConan: false,
      rank: 0,
    }
  })
  entries.push({
    id: 'conan',
    name: data.profile?.name ?? 'Conan',
    country: 'VN',
    avatarSeed: 0,
    frameId: state.equipped.frame ?? 'frame-starter',
    xp: gameStats(data, date).weeklyXp,
    isConan: true,
    rank: 0,
  })
  entries.sort(
    (a, b) => b.xp - a.xp || Number(a.isConan) - Number(b.isConan) || a.id.localeCompare(b.id),
  )
  return entries.map((entry, i) => ({ ...entry, rank: i + 1 }))
}
