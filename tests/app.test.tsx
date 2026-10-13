// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../src/App'
import { DemoRepository } from '../src/repository'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-14T08:00:00Z'))
  localStorage.clear()
  history.replaceState(null, '', '/?demo=1')
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const tick = (name: RegExp) => screen.getByRole('checkbox', { name })
async function open(role = 'learner') {
  const result = render(<App />)
  await screen.findByRole('heading', { name: 'Hôm nay' })
  if (role !== 'learner') {
    fireEvent.change(screen.getByRole('combobox', { name: 'Vai trong bản minh hoạ' }), {
      target: { value: role },
    })
    await screen.findByRole('heading', { name: 'Hôm nay' })
  }
  return result
}

describe('working app flows in a local DOM', () => {
  it('ticks a task and keeps it after the app is reopened', async () => {
    const app = await open()
    fireEvent.click(tick(/Ôn thẻ Anki/))
    await waitFor(() => expect(tick(/Ôn thẻ Anki/).getAttribute('aria-checked')).toBe('true'))
    app.unmount()
    await open()
    expect(tick(/Ôn thẻ Anki/).getAttribute('aria-checked')).toBe('true')
  })
  it('requires the review note, saves it together with the tick and shows it after reopening', async () => {
    await open()
    fireEvent.click(tick(/^Ôn bài đã học:/))
    await screen.findByText('Ghi một dòng về điều em đã ôn trước nhé.')
    expect(tick(/^Ôn bài đã học:/).getAttribute('aria-checked')).toBe('false')
    fireEvent.change(screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }), {
      target: { value: 'Sửa 3 bài sai về phân số' },
    })
    fireEvent.click(tick(/^Ôn bài đã học:/))
    await waitFor(() => expect(tick(/^Ôn bài đã học:/).getAttribute('aria-checked')).toBe('true'))
    cleanup()
    await open()
    expect(
      (screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }) as HTMLTextAreaElement).value,
    ).toBe('Sửa 3 bài sai về phân số')
  })
  it('lets a learner choose their avatar and colour without exposing mentor controls', async () => {
    await open()
    expect(screen.queryByRole('button', { name: 'Quản lý' })).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: 'Chọn avatar và màu' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Góc này là của em' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cầu thủ' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tím' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Chọn xong/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.querySelector('.app')!.getAttribute('data-accent')).toBe('violet')
    expect((screen.getByAltText('Avatar em đã chọn') as HTMLImageElement).src).toContain(
      'football.png',
    )
  })
  it('gives parents a read-only checklist and a working encouragement form', async () => {
    await open('parent')
    expect((tick(/Ôn thẻ Anki/) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Quản lý' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chọn avatar và màu' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mục tiêu' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Một lời gửi em' }), {
      target: { value: 'Ba ghi nhận hôm nay con đã tự mở sách.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }))
    await screen.findByText('Ba ghi nhận hôm nay con đã tự mở sách.')
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
    // Open the first settings disclosure; its semantic summary is the task title.
    fireEvent.click(screen.getByText('Ôn thẻ Anki'))
    const url = screen.getAllByRole('textbox', { name: 'URL website học' })[0]
    fireEvent.change(url, { target: { value: 'https://example.com/anki' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu kế hoạch' }))
    await screen.findByText('Đã lưu kế hoạch áp dụng từ 15/10.')
    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    expect(screen.queryByRole('link', { name: 'Mở học' })).toBeNull()
    const data = JSON.parse(localStorage.getItem('conan-tracker-demo-v1')!)
    expect(
      data.plans.find((p: { effectiveFrom: string }) => p.effectiveFrom === '2026-10-15').habits[0]
        .url,
    ).toBe('https://example.com/anki')
  })
  it('retains an unsaved note when another tab updates the same review', async () => {
    await open()
    fireEvent.change(screen.getByRole('textbox', { name: 'Hôm nay em đã ôn gì?' }), {
      target: { value: 'Em đang ghi về phân số' },
    })
    await act(async () => {
      await new DemoRepository('mentor', localStorage, () => '2026-10-14').saveCheckin({
        date: '2026-10-14',
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
      (c: { date: string; habitId: string }) => c.date === '2026-10-14' && c.habitId === 'review',
    )
    expect(saved).toMatchObject({ note: 'Em đang ghi về phân số', version: 2 })
  })
  it('does not pretend a failed save succeeded', async () => {
    await open()
    vi.spyOn(DemoRepository.prototype, 'saveCheckin').mockRejectedValueOnce(
      new Error('Mạng chưa kết nối'),
    )
    fireEvent.click(tick(/Ôn thẻ Anki/))
    await screen.findByText('Chưa xác nhận lưu: Mạng chưa kết nối')
    expect(tick(/Ôn thẻ Anki/).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('distinguishes a completed save from a failed refresh', async () => {
    await open()
    vi.spyOn(DemoRepository.prototype, 'load').mockRejectedValueOnce(
      new Error('Không tải được snapshot'),
    )
    fireEvent.click(tick(/Ôn thẻ Anki/))
    await screen.findByText(
      'Đã lưu, nhưng chưa tải được tiến độ mới. Hãy tải lại trang để kiểm tra.',
    )
    await waitFor(() => expect(tick(/Ôn thẻ Anki/).getAttribute('aria-checked')).toBe('true'))
  })
})

it('puts all six tasks and adult messages on the homepage', async () => {
  await open('parent')
  expect(screen.getAllByRole('checkbox')).toHaveLength(6)
  expect(tick(/Tập viết tiếng Việt/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Viết lời nhắn' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Một lời gửi em' }), {
    target: { value: 'Ba thấy con đã cố gắng hôm nay.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }))
  await screen.findByText('Ba thấy con đã cố gắng hôm nay.')
  expect(screen.getByRole('heading', { name: 'Hôm nay' })).toBeTruthy()
})
it('keeps one status menu open, closes outside and on Escape, and records a minimum', async () => {
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện tính nhẩm' }))
  expect(screen.getAllByRole('menu')).toHaveLength(1)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('menu')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn mức cho Luyện ngữ pháp' }))
  fireEvent.click(screen.getByRole('menuitem', { name: 'Ít nhất 20 câu' }))
  await waitFor(() => expect(tick(/Luyện ngữ pháp/).getAttribute('aria-checked')).toBe('mixed'))
  fireEvent.click(tick(/Luyện ngữ pháp/))
  await waitFor(() => expect(tick(/Luyện ngữ pháp/).getAttribute('aria-checked')).toBe('true'))
})
it('follows Vietnam today across midnight while preserving an explicitly selected historical date', async () => {
  await open()
  vi.setSystemTime(new Date('2026-10-14T17:00:01Z'))
  fireEvent.focus(window)
  await waitFor(() =>
    expect((screen.getByLabelText('Chọn ngày ghi nhận') as HTMLInputElement).value).toBe(
      '2026-10-15',
    ),
  )
  fireEvent.change(screen.getByLabelText('Chọn ngày ghi nhận'), { target: { value: '2026-10-14' } })
  vi.setSystemTime(new Date('2026-10-15T17:00:01Z'))
  fireEvent.focus(window)
  expect((screen.getByLabelText('Chọn ngày ghi nhận') as HTMLInputElement).value).toBe('2026-10-14')
  fireEvent.click(screen.getByRole('button', { name: 'Về hôm nay' }))
  await waitFor(() =>
    expect((screen.getByLabelText('Chọn ngày ghi nhận') as HTMLInputElement).value).toBe(
      '2026-10-16',
    ),
  )
})
it('renders a recovery state for an empty schedule rather than crashing', async () => {
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
