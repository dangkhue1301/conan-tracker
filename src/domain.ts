import type { CheckinStatus, Habit, HabitId, Plan, Role, Snapshot } from './types'

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export function today(now = new Date()): string {
  const parts = dateFormat.formatToParts(now)
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-')
}
export function addDays(date: string, amount: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}
export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay() || 7
}
export function weekStart(date: string): string {
  return addDays(date, 1 - weekday(date))
}
export const weekDays = (start: string) => Array.from({ length: 7 }, (_, i) => addDays(start, i))
export function shortDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`
}
export function longDate(date: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00Z`))
}
export function planForDate(plans: Plan[], date: string): Plan | undefined {
  return plans.reduce<Plan | undefined>(
    (found, p) =>
      p.effectiveFrom <= date && (!found || p.effectiveFrom > found.effectiveFrom) ? p : found,
    undefined,
  )
}
export const habitTitle = (h: Habit) =>
  h.id === 'review' ? 'Ôn bài đã học' : h.id === 'writing' ? 'Tập viết tiếng Việt' : h.title
export function snapshotIndex(data: Snapshot) {
  return {
    checkins: new Map(data.checkins.map((c) => [`${c.date}:${c.habitId}`, c])),
    excuses: new Map(data.excuses.map((e) => [e.date, e])),
  }
}
export function activeHabits(plan: Plan | undefined): Habit[] {
  return (
    plan?.habits.filter((h) =>
      h.id === 'review' ? plan.phase >= 3 : h.id === 'writing' ? plan.phase >= 2 : true,
    ) ?? []
  )
}
export function canEdit(role: Role, date: string, currentDate = today()): boolean {
  return (
    date <= currentDate &&
    (role === 'mentor' || (role === 'learner' && date >= weekStart(currentDate)))
  )
}
export function safeUrl(value: string): boolean {
  if (!value) return true
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
export function validateHabits(habits: Habit[]): string | null {
  const required = ['anki', 'grammar', 'mental', 'review', 'reading', 'writing']
  if (habits.length !== 6 || required.some((id) => habits.filter((h) => h.id === id).length !== 1))
    return 'Cần đủ sáu thói quen, mỗi việc một lần.'
  for (const h of habits) {
    if (!Number.isInteger(h.target) || h.target <= 0 || h.target > 10000)
      return `${h.title}: mốc làm đủ phải là số nguyên từ 1 đến 10000.`
    if (
      h.minimum !== null &&
      (!Number.isInteger(h.minimum) || h.minimum <= 0 || h.minimum > h.target)
    )
      return `${h.title}: mức ít nhất cần lớn hơn 0 và không vượt mốc làm đủ.`
    if (!h.title.trim() || h.title.length > 100) return 'Tên việc cần từ 1 đến 100 ký tự.'
    if (!['phút', 'câu', 'trang'].includes(h.unit)) return 'Đơn vị không hợp lệ.'
    if (!['morning', 'review', 'evening'].includes(h.period)) return 'Buổi học không hợp lệ.'
    if (!safeUrl(h.url) || h.url.length > 2048)
      return `${h.title}: đường dẫn cần bắt đầu bằng https:// hoặc http:// và không vượt 2048 ký tự.`
    for (let d = 1; d <= 7; d++) {
      const s = h.schedule[String(d)]
      if (
        !s ||
        typeof s.time !== 'string' ||
        typeof s.subject !== 'string' ||
        s.subject.length > 100 ||
        (s.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))
      )
        return `${h.title}: giờ hoặc nội dung theo thứ chưa hợp lệ.`
    }
  }
  return null
}
export function hasMinimum(habit: Habit): boolean {
  return habit.minimum !== null && habit.minimum < habit.target
}
export function isCredited(status?: CheckinStatus): boolean {
  return !!status && status !== 'not_started'
}
export function weeklyStats(
  data: Snapshot,
  start: string,
  currentDate = today(),
  index = snapshotIndex(data),
) {
  let planned = 0,
    credited = 0,
    minimum = 0,
    done = 0,
    extra = 0,
    missed = 0
  const perHabit: Partial<Record<HabitId, { planned: number; credited: number; missed: number }>> =
    {}
  for (const date of weekDays(start)) {
    if (!data.profile || date < data.profile.startedOn || index.excuses.has(date)) continue
    const plan = planForDate(data.plans, date)
    for (const habit of activeHabits(plan)) {
      planned++
      const row = (perHabit[habit.id] ??= { planned: 0, credited: 0, missed: 0 })
      row.planned++
      const check = index.checkins.get(`${date}:${habit.id}`)
      if (isCredited(check?.status)) {
        credited++
        row.credited++
        if (check?.status === 'minimum') minimum++
        if (check?.status === 'done') done++
        if (check?.status === 'extra') extra++
      } else if (date < currentDate) {
        missed++
        row.missed++
      }
    }
  }
  return {
    planned,
    credited,
    minimum,
    done,
    extra,
    missed,
    perHabit,
    rate: planned ? Math.round((credited / planned) * 100) : null,
    target: Math.ceil(planned * 0.8),
    ended: addDays(start, 6) < currentDate,
  }
}
export function currentPeriod(now = new Date()): Habit['period'] {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      hour12: false,
    }).format(now),
  )
  return hour < 12 ? 'morning' : hour < 21 ? 'review' : 'evening'
}
