import type { Habit, HabitId, Profile } from './types'
import { today } from './domain'

export const HABIT_IDS: HabitId[] = ['anki', 'grammar', 'mental', 'review', 'reading', 'writing']
const schedule = (time: string) =>
  Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [String(i + 1), { time: i < 5 ? time : '', subject: '' }]),
  )
export function defaultHabits(): Habit[] {
  const readingSchedule = schedule('21:00')
  readingSchedule['5'].time = '21:15'
  const writingSchedule = schedule('21:10')
  writingSchedule['5'].time = '21:25'
  return [
    {
      id: 'anki',
      title: 'Ôn thẻ Anki',
      minimum: null,
      target: 10,
      unit: 'phút',
      url: '',
      period: 'morning',
      schedule: schedule('05:15'),
    },
    {
      id: 'grammar',
      title: 'Luyện ngữ pháp',
      minimum: 20,
      target: 30,
      unit: 'câu',
      url: '',
      period: 'morning',
      schedule: schedule('05:25'),
    },
    {
      id: 'mental',
      title: 'Luyện tính nhẩm',
      minimum: 6,
      target: 8,
      unit: 'phút',
      url: '',
      period: 'morning',
      schedule: schedule('05:37'),
    },
    {
      id: 'review',
      title: 'Ôn bài',
      minimum: 20,
      target: 30,
      unit: 'phút',
      url: '',
      period: 'review',
      schedule: {
        '1': { time: '19:45', subject: 'Toán' },
        '2': { time: '18:00', subject: 'KHTN' },
        '3': { time: '18:00', subject: 'Văn' },
        '4': { time: '18:00', subject: 'Sửa bài sai Toán' },
        '5': { time: '20:45', subject: 'Tiếng Anh' },
        '6': { time: '', subject: 'Ôn linh hoạt cùng thầy/cô' },
        '7': { time: '', subject: 'Ôn linh hoạt cùng thầy/cô' },
      },
    },
    {
      id: 'reading',
      title: 'Đọc sách chữ',
      minimum: 4,
      target: 5,
      unit: 'trang',
      url: '',
      period: 'evening',
      schedule: readingSchedule,
    },
    {
      id: 'writing',
      title: 'Viết vài câu',
      minimum: 4,
      target: 6,
      unit: 'câu',
      url: '',
      period: 'evening',
      schedule: writingSchedule,
    },
  ]
}
export const defaultProfile = (): Profile => ({
  name: 'Conan',
  startedOn: today(),
  avatar: 'detective',
  accent: 'teal',
  familyPhoto: null,
})
export const STATUS_LABELS = {
  not_started: 'Chưa ghi nhận',
  minimum: 'Đã làm ít nhất',
  done: 'Làm đủ',
  extra: 'Làm thêm',
} as const
export const ROLE_LABELS = { learner: 'Conan', mentor: 'Người hướng dẫn', parent: 'Ba mẹ' } as const
export const AUTONOMY_LABELS = {
  less_reminding: 'Ít cần nhắc hơn',
  same: 'Tương tự tuần trước',
  more_reminding: 'Cần hỗ trợ nhiều hơn',
} as const
export const PHASE_LABELS = {
  1: '4 thói quen · bắt đầu',
  2: '5 thói quen · thêm viết',
  3: '6 thói quen · thêm ôn bài',
} as const
