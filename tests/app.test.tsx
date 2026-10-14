// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../src/App'
import { DemoRepository, demoSnapshot } from '../src/repository'
import { HABIT_IDS, ROLE_LABELS } from '../src/defaults'
import { longDate } from '../src/domain'

const date = '2026-10-14'
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-14T08:00:00Z'))
  localStorage.clear()
  localStorage.setItem('conan-tracker-demo-v1', JSON.stringify(demoSnapshot('learner', date)))
  // Celebration behavior has its own tests. These flows start with prior milestones read.
  const seenMilestones = ['global', ...HABIT_IDS].flatMap((id) =>
    [7, 10, 30, 60, 100, 180, 365].map((count) => `${id}:${count}`),
  )
  for (const role of ['learner', 'mentor', 'parent'])
    localStorage.setItem(
      `conan-tracker-demo-v1-receipts-${role}`,
      JSON.stringify({ seenMilestones, readMessageIds: [] }),
    )
  history.replaceState(null, '', '/?demo=1')
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
const board = () => screen.getByRole('region', { name: 'Bảng thói quen tuần' })
const tick = (name: RegExp, day = date) =>
  within(board()).getByRole('checkbox', {
    name: (label) => name.test(label) && label.includes(longDate(day)),
  })
const detailTick = (name: RegExp) =>
  within(screen.getByRole('dialog')).getByRole('checkbox', { name })
async function details() {
  fireEvent.click(screen.getByRole('button', { name: 'Ghi chi tiết hôm nay' }))
  return screen.findByRole('dialog', { name: 'Ghi chi tiết · 14/10' })
}
function closeDialog() {
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getAllByRole('button', { name: 'Đóng' })[0])
}
async function open(role: 'learner' | 'mentor' | 'parent' = 'learner') {
  const result = render(<App />)
  await screen.findByRole('heading', { name: 'Hôm nay' })
  if (role !== 'learner') {
    fireEvent.change(screen.getByRole('combobox', { name: 'Vai trong bản minh hoạ' }), {
      target: { value: role },
    })
    await waitFor(() =>
      expect(document.querySelector('.role-pill')?.textContent).toBe(ROLE_LABELS[role]),
    )
  }
  return result
}
async function writeEncouragement(message: string) {
  fireEvent.click(screen.getByRole('button', { name: /^Lời nhắn dành cho em/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Viết lời nhắn cho Conan' }))
  const dialog = screen.getByRole('dialog', { name: 'Gửi một lời động viên' })
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Một lời gửi em' }), {
    target: { value: message },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi lời nhắn' }))
  await screen.findByText('Đã gửi em lời động viên.')
  closeDialog()
  fireEvent.click(screen.getByRole('button', { name: /^Lời nhắn dành cho em/ }))
  await screen.findByText(message)
}

describe('working app flows in a local DOM', () => {
  it('ticks today directly in the board and keeps it after reopening', async () => {
    const app = await open()
    fireEvent.click(tick(/^Ôn thẻ Anki,/))
    await waitFor(() => expect(tick(/^Ôn thẻ Anki,/).getAttribute('aria-checked')).toBe('true'))
    app.unmount()
    await open()
    expect(tick(/^Ôn thẻ Anki,/).getAttribute('aria-checked')).toBe('true')
  })
  it('requires the review note in details, saves it together with the tick and keeps it after reopening', async () => {
    await open()
    expect(screen.queryByRole('textbox', { name: 'Hôm nay em đã ôn gì?' })).toBeNull()
    fireEvent.click(tick(/^Ôn bài đã học,/))
    const dialog = screen.getByRole('dialog', { name: 'Ôn bài đã học · 14/10' })
    fireEvent.click(detailTick(/^Ôn bài đã học:/))
    await screen.findByText('Ghi một dòng về điều em đã ôn trước nhé.')
    expect(detailTick(/^Ôn bài đã học:/).getAttribute('aria-checked')).toBe('false')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }), {
      target: { value: 'Sửa 3 bài sai về phân số' },
    })
    fireEvent.click(detailTick(/^Ôn bài đã học:/))
    await waitFor(() =>
      expect(detailTick(/^Ôn bài đã học:/).getAttribute('aria-checked')).toBe('true'),
    )
    cleanup()
    await open()
    await details()
    expect(
      (screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }) as HTMLTextAreaElement).value,
    ).toBe('Sửa 3 bài sai về phân số')
  })
  it('lets Conan upload an avatar and persist light/dark mode without mentor controls', async () => {
    const NativeURL = URL
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static createObjectURL = vi.fn(() => 'blob:conan-avatar-preview')
        static revokeObjectURL = vi.fn()
      },
    )
    const app = await open()
    expect(screen.queryByRole('button', { name: 'Quản lý' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Bật giao diện tối' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh hồ sơ và avatar' }))
    const dialog = screen.getByRole('dialog', { name: 'Góc cá nhân của Conan' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tải ảnh của em' }))
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(['conan-avatar-content'], 'conan.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })
    await within(dialog).findByText('conan.png')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu avatar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const image = await screen.findByAltText('Avatar của Conan')
    expect((image as HTMLImageElement).src).toMatch(/^data:image\/png;base64,/)
    app.unmount()
    await open()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(((await screen.findByAltText('Avatar của Conan')) as HTMLImageElement).src).toMatch(
      /^data:image\/png;base64,/,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bật giao diện sáng' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
  it('gives parents a read-only board and a working encouragement bubble', async () => {
    await open('parent')
    expect((tick(/^Ôn thẻ Anki,/) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Quản lý' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chỉnh hồ sơ và avatar' })).toBeNull()
    await writeEncouragement('Ba ghi nhận hôm nay con đã tự mở sách.')
  })
  it('opens weekly history and disables learner edits for prior weeks', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Tiến độ' }))
    await screen.findByRole('heading', { name: 'Tiến độ của em' })
    fireEvent.click(screen.getByRole('button', { name: 'Tuần trước' }))
    fireEvent.click(screen.getAllByRole('button', { name: /^Ôn thẻ Anki,/ })[0])
    const dialog = screen.getByRole('dialog')
    expect(
      (within(dialog).getByRole('checkbox', { name: /Ôn thẻ Anki/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(within(dialog).getByText('Tuần cũ được xem lại cùng người hướng dẫn.')).toBeTruthy()
  })
  it('lets a mentor save a future learning URL without changing today’s links', async () => {
    await open('mentor')
    fireEvent.click(screen.getByRole('button', { name: 'Quản lý' }))
    await screen.findByRole('heading', { name: 'Quản lý góc học tập' })
    fireEvent.click(screen.getByText('Ôn thẻ Anki'))
    fireEvent.change(screen.getAllByRole('textbox', { name: 'URL website học' })[0], {
      target: { value: 'https://example.com/anki' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu kế hoạch' }))
    await screen.findByText('Đã lưu kế hoạch áp dụng từ 15/10.')
    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    expect(within(board()).queryByRole('link', { name: /^Ôn thẻ Anki/ })).toBeNull()
    const data = JSON.parse(localStorage.getItem('conan-tracker-demo-v1')!)
    expect(
      data.plans.find((p: { effectiveFrom: string }) => p.effectiveFrom === '2026-10-15').habits[0]
        .url,
    ).toBe('https://example.com/anki')
  })
  it('retains an unsaved detail note when another tab updates the same review', async () => {
    await open()
    await details()
    fireEvent.change(screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }), {
      target: { value: 'Em đang ghi về phân số' },
    })
    await act(async () => {
      await new DemoRepository('mentor', localStorage, () => date).saveCheckin({
        date,
        habitId: 'review',
        status: 'done',
        note: 'Bản vừa sửa ở nơi khác',
        expectedVersion: 0,
      })
      window.dispatchEvent(new StorageEvent('storage', { key: 'conan-tracker-demo-v1' }))
    })
    await screen.findByText('Ghi chú mới ở nơi khác: Bản vừa sửa ở nơi khác')
    expect(
      (screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }) as HTMLTextAreaElement).value,
    ).toBe('Em đang ghi về phân số')
    fireEvent.click(screen.getByRole('button', { name: 'Giữ bản đang nhập' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
    await waitFor(() => expect(screen.queryByText('Chưa lưu ghi chú')).toBeNull())
    const saved = JSON.parse(localStorage.getItem('conan-tracker-demo-v1')!).checkins.find(
      (c: { date: string; habitId: string }) => c.date === date && c.habitId === 'review',
    )
    expect(saved).toMatchObject({ note: 'Em đang ghi về phân số', version: 2 })
  })
  it('does not pretend a failed save succeeded', async () => {
    await open()
    vi.spyOn(DemoRepository.prototype, 'saveCheckin').mockRejectedValueOnce(
      new Error('Mạng chưa kết nối'),
    )
    fireEvent.click(tick(/^Ôn thẻ Anki,/))
    await screen.findByText('Chưa xác nhận lưu: Mạng chưa kết nối')
    expect(tick(/^Ôn thẻ Anki,/).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('distinguishes a completed save from a failed refresh', async () => {
    await open()
    vi.spyOn(DemoRepository.prototype, 'load').mockRejectedValueOnce(
      new Error('Không tải được snapshot'),
    )
    fireEvent.click(tick(/^Ôn thẻ Anki,/))
    await screen.findByText(
      'Đã lưu, nhưng chưa tải được tiến độ mới. Hãy tải lại trang để kiểm tra.',
    )
    await waitFor(() => expect(tick(/^Ôn thẻ Anki,/).getAttribute('aria-checked')).toBe('true'))
  })
})

it('puts all seven tasks in today’s board and keeps the parent message on the homepage', async () => {
  await open('parent')
  expect(
    within(board()).getAllByRole('checkbox', { name: (label) => label.includes(longDate(date)) }),
  ).toHaveLength(7)
  expect(tick(/^Tập viết tiếng Việt,/)).toBeTruthy()
  expect(tick(/^Dọn bàn học và sách vở,/)).toBeTruthy()
  await writeEncouragement('Ba thấy con đã cố gắng hôm nay.')
  closeDialog()
  expect(screen.getByRole('heading', { name: 'Hôm nay' })).toBeTruthy()
  expect(screen.getByRole('button', { name: /^Lời nhắn dành cho em/ })).toBeTruthy()
})
it('keeps a desk-tidying tick after reopening and shows it in weekly history', async () => {
  const app = await open()
  fireEvent.click(tick(/^Dọn bàn học và sách vở,/))
  await waitFor(() =>
    expect(tick(/^Dọn bàn học và sách vở,/).getAttribute('aria-checked')).toBe('true'),
  )
  app.unmount()
  await open()
  expect(tick(/^Dọn bàn học và sách vở,/).getAttribute('aria-checked')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Tiến độ' }))
  expect(
    await screen.findByRole('button', { name: /^Dọn bàn học và sách vở, .*Làm đủ$/ }),
  ).toBeTruthy()
})
it('includes desk tidying when a mentor copies a legacy six-habit schedule', async () => {
  await open('mentor')
  fireEvent.click(screen.getByRole('button', { name: 'Quản lý' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Sao chép cấu hình từ' }), {
    target: { value: 'demo-plan-1' },
  })
  expect(screen.getByText('Dọn bàn học và sách vở')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu kế hoạch' }))
  await screen.findByText('Đã lưu kế hoạch áp dụng từ 15/10.')
  const data = JSON.parse(localStorage.getItem('conan-tracker-demo-v1')!)
  expect(
    data.plans.find((p: { effectiveFrom: string }) => p.effectiveFrom === '2026-10-15').habits,
  ).toHaveLength(7)
})
it('keeps one detail status menu open, closes outside and on Escape, and records a minimum', async () => {
  await open()
  await details()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện tính nhẩm' }))
  expect(screen.getAllByRole('menu')).toHaveLength(1)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).toBeNull()
  expect(screen.getByRole('dialog')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('menu')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Ít nhất 20 câu' }))
  await waitFor(() =>
    expect(detailTick(/^Luyện ngữ pháp:/).getAttribute('aria-checked')).toBe('mixed'),
  )
  fireEvent.click(detailTick(/^Luyện ngữ pháp:/))
  await waitFor(() =>
    expect(detailTick(/^Luyện ngữ pháp:/).getAttribute('aria-checked')).toBe('true'),
  )
})
it('follows Vietnam today across midnight and keeps an explicitly selected historical week', async () => {
  await open()
  expect((tick(/^Ôn thẻ Anki,/, '2026-10-15') as HTMLButtonElement).disabled).toBe(true)
  vi.setSystemTime(new Date('2026-10-14T17:00:01Z'))
  fireEvent.focus(window)
  await waitFor(() =>
    expect((tick(/^Ôn thẻ Anki,/, '2026-10-15') as HTMLButtonElement).disabled).toBe(false),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Tuần trước' }))
  expect(screen.getByText('05/10 – 11/10')).toBeTruthy()
  vi.setSystemTime(new Date('2026-10-18T17:00:01Z'))
  fireEvent.focus(window)
  await waitFor(() => expect(screen.getByText('05/10 – 11/10')).toBeTruthy())
  expect(
    within(board()).queryByRole('checkbox', {
      name: (label) => label.includes(longDate('2026-10-19')),
    }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Tuần này' }))
  await waitFor(() => expect(screen.getByText('19/10 – 25/10')).toBeTruthy())
  expect(tick(/^Ôn thẻ Anki,/, '2026-10-19')).toBeTruthy()
})
it('renders recovery for an empty schedule instead of crashing', async () => {
  const original = DemoRepository.prototype.load
  vi.spyOn(DemoRepository.prototype, 'load').mockImplementation(async function (
    this: DemoRepository,
  ) {
    const data = await original.call(this)
    data.plans = []
    return data
  })
  render(<App />)
  await screen.findByRole('heading', { name: 'Chưa có lịch học đang áp dụng' })
  expect(screen.queryByRole('checkbox')).toBeNull()
})
