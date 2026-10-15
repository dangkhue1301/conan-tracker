// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  AvatarStudio,
  CosmeticDialog,
  MilestoneCelebration,
  CosmeticArt,
  ProfileAvatar,
  CELEBRATION_STYLES,
} from '../src/cosmetics'
import { SHOP_ITEMS } from '../src/shop-catalog'
import { defaultHabits } from '../src/defaults'
import { addDays } from '../src/domain'
import { emptyGameState, gameStats, leagueEntries, LEAGUES } from '../src/gamification'
import { League } from '../src/pages/GameExtras'
import Shop from '../src/pages/Shop'
import { DemoRepository, demoSnapshot } from '../src/repository'
import type { Run } from '../src/App'
import type { Role, Snapshot } from '../src/types'
import { Modal } from '../src/ui'
import { readFileSync } from 'node:fs'

const DATE = '2026-10-14'
const STORAGE = 'conan-tracker-demo-v1'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-14T08:00:00Z'))
  localStorage.clear()
  history.replaceState(null, '', '/?demo=1')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function fixture(role: Role = 'learner', manyCoins = false): Snapshot {
  const data = demoSnapshot(role, DATE)
  data.profile!.startedOn = '2026-09-01'
  data.plans = [
    { id: 'plan', revision: 1, phase: 3, effectiveFrom: '2026-09-01', habits: defaultHabits() },
  ]
  data.checkins = []
  data.game = emptyGameState()
  const dates = manyCoins
    ? Array.from({ length: 20 }, (_, i) => addDays('2026-09-01', i * 2))
    : ['2026-10-10', '2026-10-11']
  for (const date of dates)
    for (const habit of defaultHabits())
      data.checkins.push({
        date,
        habitId: habit.id,
        status: 'done',
        note: habit.id === 'review' ? 'Ôn các bài phân số' : '',
        planId: 'plan',
        version: 1,
        updatedAt: `${date}T08:00:00Z`,
        updatedBy: 'learner',
      })
  localStorage.setItem(STORAGE, JSON.stringify(data))
  return data
}

function ShopHarness({ initial, repo }: { initial: Snapshot; repo: DemoRepository }) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false)
  const run: Run = async (action) => {
    setBusy(true)
    try {
      await action()
      setData(await repo.load())
      return true
    } catch {
      return false
    } finally {
      setBusy(false)
    }
  }
  return <Shop data={data} repo={repo} run={run} busy={busy} currentDate={DATE} />
}

describe('Shop integration with persisted Coin and XP', () => {
  it('shows all nine Basic frames with plain names, the corrected 14-day gate and separate Premium versions', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      action = vi.spyOn(repo, 'gameAction')
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm vật phẩm' }), {
      target: { value: 'Basic' },
    })
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(9)
    for (const item of SHOP_ITEMS.filter(
      (entry) => entry.premium === false && entry.collection === 'demon-slayer',
    )) {
      const card = screen.getByRole('button', { name: `${item.name}, 1.800 Conan Coin` })
      expect(within(card).getByText('BASIC')).toBeTruthy()
      expect(card.querySelector('.cosmetic-premium-name')).toBeNull()
      expect(
        card.querySelector('.shop-item-content > strong > span')?.getAttribute('style'),
      ).toBeNull()
      expect(card.textContent).toContain('14 ngày')
      expect(card.querySelector('.cosmetic-frame-raster')?.getAttribute('src')).toContain(
        item.artwork,
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'Muichiro - Basic, 1.800 Conan Coin' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(
      dialog
        .getByRole('heading', { name: 'Muichiro - Basic' })
        .querySelector('.cosmetic-premium-name'),
    ).toBeNull()
    expect(dialog.getByText('2 / 14 ngày')).toBeTruthy()
    expect(dialog.getByText('1.800')).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelector('.cosmetic-frame-raster')?.getAttribute('src'),
    ).toContain('cosmetics/demon-slayer/basic/muichiro-frame.png')
    fireEvent.click(dialog.getByText('Đóng', { selector: 'button' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm vật phẩm' }), {
      target: { value: 'Muichiro' },
    })
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(2)
    expect(
      screen
        .getByRole('button', { name: 'Muichiro - Premium, 4.000 Conan Coin' })
        .querySelector('.cosmetic-premium-name'),
    ).toBeTruthy()
    expect(action).not.toHaveBeenCalled()
  })

  it('removes the weapons category and hides legacy weapons on the profile', () => {
    const data = fixture(),
      repo = new DemoRepository('learner')
    data.game!.inventory.push('weapon-fire-1')
    data.game!.equipped.weapon = 'weapon-fire-1'
    render(<ShopHarness initial={data} repo={repo} />)
    expect(screen.queryByRole('button', { name: 'Kiếm & vũ khí' })).toBeNull()
    expect(document.querySelector('.profile-cosmetic-weapon')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Muichiro - Premium, 4.000 Conan Coin' }).textContent,
    ).toContain('40 ngày')
    expect(data.game!.inventory).toContain('weapon-fire-1')
  })
  it('finds the Demon Slayer collection across categories and distinguishes its Premium name without buying', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      action = vi.spyOn(repo, 'gameAction')
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bạn đồng hành' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Bộ sưu tập / chủ đề' }), {
      target: { value: 'demon-slayer' },
    })
    expect(screen.getByRole('button', { name: 'Khung avatar' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(23)
    for (const item of SHOP_ITEMS.filter(
      (entry) => entry.collection === 'demon-slayer' && entry.premium,
    )) {
      const card = screen.getByRole('button', { name: `${item.name}, 4.000 Conan Coin` })
      expect(within(card).getByText('PREMIUM')).toBeTruthy()
      expect(card.querySelector('.cosmetic-frame-raster')?.getAttribute('src')).toContain(
        item.artwork,
      )
      if (item.namePalette) {
        const name = card.querySelector<HTMLElement>('.cosmetic-premium-name')!
        expect(name.style.getPropertyValue('--premium-light-ink')).toBe(item.namePalette.light[0])
        expect(name.style.getPropertyValue('--premium-dark-ink')).toBe(item.namePalette.dark[0])
      }
    }
    const premium = screen.getByRole('button', {
      name: 'Muichiro - Premium, 4.000 Conan Coin',
    })
    expect(within(premium).getByText('Demon Slayer')).toBeTruthy()
    expect(premium.querySelector('.cosmetic-premium-name')?.textContent).toBe('Muichiro - Premium')
    expect(premium.textContent).toContain('40 ngày')
    fireEvent.click(premium)
    const dialog = within(screen.getByRole('dialog')),
      name = dialog.getByRole('heading', { name: 'Muichiro - Premium' })
    expect(name.querySelector('.cosmetic-premium-name')?.textContent).toBe('Muichiro - Premium')
    expect(dialog.getByText('Demon Slayer')).toBeTruthy()
    expect(dialog.getByText('4.000')).toBeTruthy()
    expect(dialog.getByText('2 / 40 ngày')).toBeTruthy()
    expect(
      (dialog.getByRole('button', { name: 'Cần thêm cố gắng' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.click(dialog.getByText('Đóng', { selector: 'button' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Bộ sưu tập / chủ đề' }), {
      target: { value: 'all' },
    })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm vật phẩm' }), {
      target: { value: 'Demon Slayer' },
    })
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(23)
    expect(
      screen.getByRole('button', { name: 'Muichiro - Premium, 4.000 Conan Coin' }),
    ).toBeTruthy()
    expect(action).not.toHaveBeenCalled()
  })
  it('finds all eight Blue Lock characters with Premium colors and keeps collection filters separate', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      action = vi.spyOn(repo, 'gameAction')
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh bìa', exact: true }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Bộ sưu tập / chủ đề' }), {
      target: { value: 'blue-lock' },
    })
    expect(screen.getByRole('button', { name: 'Khung avatar' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(8)
    for (const character of [
      'Kunigami',
      'Aiku',
      'Chigiri',
      'Nagi',
      'Rin',
      'Bachira',
      'Isagi',
      'Sae',
    ]) {
      const card = screen.getByRole('button', { name: `${character} - Premium, 4.000 Conan Coin` })
      expect(within(card).getByText('Blue Lock')).toBeTruthy()
      expect(within(card).getByText('PREMIUM')).toBeTruthy()
      expect(card.querySelector('.cosmetic-premium-name')?.getAttribute('style')).toContain(
        '--premium-dark-ink',
      )
      expect(card.querySelector('.cosmetic-frame-raster')?.getAttribute('src')).toContain(
        'cosmetics/blue-lock/',
      )
      expect(card.textContent).toContain('40 ngày')
    }
    expect(
      screen.queryByRole('button', { name: 'Muichiro - Premium, 4.000 Conan Coin' }),
    ).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Nagi - Premium, 4.000 Conan Coin' }))
    const dialog = within(screen.getByRole('dialog')),
      label = dialog
        .getByRole('heading', { name: 'Nagi - Premium' })
        .querySelector<HTMLElement>('.cosmetic-premium-name')!
    expect(label.style.getPropertyValue('--premium-light-ink')).toBe('#475569')
    expect(label.style.getPropertyValue('--premium-dark-ink')).toBe('#e2e8f0')
    expect(dialog.getByText('Blue Lock')).toBeTruthy()
    fireEvent.click(dialog.getByText('Đóng', { selector: 'button' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Bộ sưu tập / chủ đề' }), {
      target: { value: 'all' },
    })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm vật phẩm' }), {
      target: { value: 'Blue Lock' },
    })
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(8)
    expect(action).not.toHaveBeenCalled()
  })
  it('previews the correctly named Gyomei frame with its own colors without buying it', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      action = vi.spyOn(repo, 'gameAction')
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm vật phẩm' }), {
      target: { value: 'Gyomei' },
    })
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Gyomei - Premium, 4.000 Conan Coin' }))
    const dialog = within(screen.getByRole('dialog')),
      name = dialog.getByRole('heading', { name: 'Gyomei - Premium' }),
      label = name.querySelector<HTMLElement>('.cosmetic-premium-name')!
    expect(label.style.getPropertyValue('--premium-light-ink')).toBe('#92400e')
    expect(label.style.getPropertyValue('--premium-dark-ink')).toBe('#fbbf24')
    expect(dialog.getByText('Demon Slayer')).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelector('.cosmetic-frame-raster')?.getAttribute('src'),
    ).toContain('cosmetics/demon-slayer/gyomei-frame.png')
    expect(action).not.toHaveBeenCalled()
  })
  it('requires confirmation, purchases once, preserves XP, then equips and removes an owned title', async () => {
    const data = fixture(),
      repo = new DemoRepository('learner', localStorage, () => DATE)
    const before = gameStats(data, DATE),
      buy = vi.spyOn(repo, 'gameAction')
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Danh hiệu', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Tân binh ngọn lửa, 100 Conan Coin' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Mua bằng Coin' }),
    )
    expect(buy).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Xác nhận lựa chọn của em' })).toBeTruthy()
    expect(screen.getByText(/Số dư sau khi mua:/).textContent).toContain(
      `${before.coins - 100} Conan Coin`,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận mua' }))
    await screen.findByRole('button', { name: 'Dùng ngay' })
    const purchased = await repo.load()
    expect(purchased.game!.inventory).toContain('title-flame-1')
    expect(gameStats(purchased, DATE)).toMatchObject({
      coins: before.coins - 100,
      xp: before.xp,
      weeklyXp: before.weeklyXp,
    })
    expect(buy.mock.calls.filter(([action]) => action.type === 'buy')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ngay' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect((await repo.load()).game!.equipped.title).toBe('title-flame-1')
    fireEvent.click(screen.getByRole('button', { name: 'Tân binh ngọn lửa, đang dùng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cất trang bị' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const unequipped = await repo.load()
    expect(unequipped.game!.equipped.title).toBeUndefined()
    expect(unequipped.game!.inventory).toContain('title-flame-1')
    expect(gameStats(unequipped, DATE).xp).toBe(before.xp)
  })

  it('shows the streak requirement and prevents purchase despite sufficient Coin', () => {
    const data = fixture('learner', true),
      repo = new DemoRepository('learner', localStorage, () => DATE)
    expect(gameStats(data, DATE).coins).toBeGreaterThan(600)
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Danh hiệu', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Bậc thầy ngọn lửa, 600 Conan Coin' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Kỷ lục streak toàn bộ thói quen')).toBeTruthy()
    expect(dialog.getByText('1 / 7 ngày')).toBeTruthy()
    expect(
      (dialog.getByRole('button', { name: 'Cần thêm cố gắng' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('keeps parent views read-only and finds only owned items after filtering', () => {
    const data = fixture('parent'),
      repo = new DemoRepository('parent', localStorage, () => DATE)
    data.game!.inventory.push('frame-gyomei')
    data.game!.equipped.frame = 'frame-gyomei'
    render(<ShopHarness initial={data} repo={repo} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bộ sưu tập đã có' }))
    expect(screen.queryByRole('button', { name: /Muichiro - Premium,/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Gyomei - Premium, đang dùng' }))
    expect(screen.queryByRole('button', { name: 'Cất trang bị' })).toBeNull()
    expect(screen.getByText('Conan và người hướng dẫn có thể mua hoặc thay trang bị.')).toBeTruthy()
  })
  it('temporarily removes sample frames from Shop and avatars while retaining their saved ownership', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      action = vi.spyOn(repo, 'gameAction')
    data.game!.inventory.push('frame-flame-2')
    data.game!.equipped.frame = 'frame-flame-2'
    const saved = structuredClone(data.game)
    render(<ShopHarness initial={data} repo={repo} />)
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(31)
    expect(document.querySelector('svg.cosmetic-frame-art')).toBeNull()
    expect(screen.queryByText('Hành trình bắt đầu')).toBeNull()
    expect(screen.queryByText('Ngọn lửa · Chiến binh')).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bộ sưu tập đã có' }))
    expect(document.querySelectorAll('.shop-item-card')).toHaveLength(0)
    expect(data.game).toEqual(saved)
    expect(action).not.toHaveBeenCalled()
  })
})

describe('league presentation', () => {
  it('refreshes live scores without a reload and catches up immediately on return', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-14T05:00:00Z'))
    const data = fixture(),
      repo = new DemoRepository('learner'),
      run = vi.fn<Run>()
    data.game!.league.tier = 9
    const actions = vi.spyOn(repo, 'gameAction')
    const timerCount = vi.getTimerCount()
    const { container, unmount } = render(
      <League data={data} repo={repo} run={run} busy={false} currentDate={DATE} />,
    )
    const readScores = () =>
      [...container.querySelectorAll('.league-row')].map((row) => ({
        id: row.getAttribute('data-player-id'),
        xp: row.querySelector('.league-xp > span')!.textContent,
      }))
    const initial = readScores()
    expect(screen.getByText('Cập nhật mỗi 15 giây')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(30 * 60000)
    })
    expect(readScores()).not.toEqual(initial)
    const expected = leagueEntries(data, DATE, new Date())
    expect(readScores().map((row) => row.id)).toEqual(expected.map((entry) => entry.id))
    for (const entry of expected)
      expect(
        container.querySelector(`[data-player-id="${entry.id}"] .league-xp > span`)!.textContent,
      ).toBe(`${entry.xp.toLocaleString('vi-VN')} XP`)
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(readScores().map((row) => row.id)).toEqual(
      leagueEntries(data, DATE, new Date()).map((entry) => entry.id),
    )
    vi.setSystemTime(new Date('2026-10-14T14:00:00Z'))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(container.querySelector('.league-live')!.textContent).toContain('21:00:00')
    expect(actions).not.toHaveBeenCalled()
    expect(run).not.toHaveBeenCalled()
    unmount()
    expect(vi.getTimerCount()).toBe(timerCount)
  })

  it('shows ten rank badges and the simulation label with inline rules instead of an information dialog', () => {
    const data = fixture(),
      repo = new DemoRepository('learner'),
      run = vi.fn<Run>()
    render(<League data={data} repo={repo} run={run} busy={false} currentDate={DATE} />)
    expect(screen.getByText('Giải đấu mô phỏng')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thông tin giải' })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    const ranks = document.querySelector('.league-path')!
    expect(ranks.querySelectorAll('.league-rank')).toHaveLength(10)
    for (const league of LEAGUES)
      expect(within(ranks as HTMLElement).getByText(league)).toBeTruthy()
    expect(ranks.querySelectorAll('svg')).toHaveLength(10)
    expect(screen.getByRole('heading', { name: 'Mục tiêu của tuần' })).toBeTruthy()
    expect(screen.getByText(/Top 20 thăng hạng/)).toBeTruthy()
    expect(screen.getByText(/Tuần chưa tham gia sẽ không bị xuống hạng/)).toBeTruthy()
    expect(run).not.toHaveBeenCalled()
  })
})

describe('uploaded avatars', () => {
  it('offers file upload, rejects GIF and oversized images, and exposes no preset-avatar or accent choices', () => {
    const data = fixture(),
      repo = new DemoRepository('learner', localStorage, () => DATE),
      run = vi.fn<Run>()
    const { container } = render(
      <AvatarStudio data={data} repo={repo} run={run} busy={false} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Tải ảnh của em' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cầu thủ' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Thám tử' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tím' })).toBeNull()
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    fireEvent.change(input, {
      target: { files: [new File(['GIF89a'], 'avatar.gif', { type: 'image/gif' })] },
    })
    expect(screen.getByRole('alert').textContent).toBe('Chọn ảnh JPG, PNG hoặc WebP.')
    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })],
      },
    })
    expect(screen.getByRole('alert').textContent).toBe('Ảnh cần nhỏ hơn hoặc bằng 5 MB.')
    expect((screen.getByRole('button', { name: 'Lưu avatar' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(run).not.toHaveBeenCalled()
  })

  it('retains a selected image after a failed upload so it can be retried and saved', async () => {
    const NativeURL = URL
    class PreviewURL extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:preview')
      static revokeObjectURL = vi.fn()
    }
    vi.stubGlobal('URL', PreviewURL)
    const data = fixture(),
      repo = new DemoRepository('learner', localStorage, () => DATE)
    const upload = vi.spyOn(repo, 'uploadAvatar').mockRejectedValueOnce(new Error('Mạng tạm ngắt'))
    const close = vi.fn(),
      run: Run = async (action) => {
        try {
          await action()
          return true
        } catch {
          return false
        }
      }
    const { container } = render(
      <AvatarStudio data={data} repo={repo} run={run} busy={false} onClose={close} />,
    )
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [new File(['image'], 'conan.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu avatar' }))
    await screen.findByRole('alert')
    expect(screen.getByText('conan.png')).toBeTruthy()
    expect(close).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu avatar' }))
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
    expect(upload).toHaveBeenCalledTimes(2)
    expect((await repo.load()).game!.avatarPath).toMatch(/^data:image\/png;base64,/)
  })
})

describe('accessible overlay lifecycle', () => {
  it('shows six distinct celebration symbols and uses the selected symbol fullscreen', () => {
    const styles = SHOP_ITEMS.filter((item) => item.category === 'celebration')
    const { unmount } = render(
      <>
        {styles.map((item) => (
          <CosmeticArt key={item.id} item={item} />
        ))}
      </>,
    )
    for (const name of [
      'Lửa cam',
      'Tia chớp vàng',
      'Kim cương xanh ngọc',
      'Vương miện tím',
      'Khiên pha lê lục bảo',
      'Sao băng hồng',
    ])
      expect(screen.getByRole('img', { name })).toBeTruthy()
    expect(new Set(styles.map((item) => CELEBRATION_STYLES[item.theme].colors[0])).size).toBe(6)
    unmount()
    render(
      <MilestoneCelebration
        milestones={[{ key: 'global:30', label: 'Chuỗi thói quen', count: 30 }]}
        styleId="celebration-manga"
        onClose={() => {}}
      />,
    )
    expect(
      within(screen.getByRole('dialog')).getByRole('img', { name: 'Vương miện tím' }),
    ).toBeTruthy()
  })
  it('previews the reference frame and hides an archived frame while switching safely', () => {
    const data = fixture(),
      repo = new DemoRepository('learner')
    const view = render(
      <ProfileAvatar data={data} repo={repo} preview={{ frame: 'frame-mist-swordsman' }} />,
    )
    const frame = document.querySelector<HTMLImageElement>('.cosmetic-frame-raster')!
    expect(frame.getAttribute('src')).toContain('cosmetics/mist-swordsman-frame.png')
    expect(document.querySelector('.profile-cosmetic-picture')).toBeTruthy()
    view.rerender(<ProfileAvatar data={data} repo={repo} preview={{ frame: 'frame-flame-1' }} />)
    expect(document.querySelector('.cosmetic-frame-raster')).toBeNull()
    expect(document.querySelector('.cosmetic-frame-art')).toBeNull()
    view.rerender(
      <ProfileAvatar data={data} repo={repo} preview={{ frame: 'frame-mist-swordsman' }} />,
    )
    expect(document.querySelector('.cosmetic-frame-raster')).toBeTruthy()
  })
  it('keeps the flame-themed celebration fixed over the viewport instead of inheriting the icon geometry', () => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = readFileSync('src/cosmetics.css', 'utf8')
    document.head.append(stylesheet)
    try {
      render(
        <MilestoneCelebration
          milestones={[{ key: 'global:10', label: 'Chuỗi thói quen', count: 10 }]}
          onClose={() => {}}
        />,
      )
      const overlay = screen.getByRole('dialog', { name: '10 ngày bền bỉ!' })
      expect(getComputedStyle(overlay).position).toBe('fixed')
      expect(getComputedStyle(overlay).width).not.toBe('230px')
      expect(getComputedStyle(overlay.querySelector('.celebration-flame')!).position).toBe(
        'relative',
      )
    } finally {
      stylesheet.remove()
    }
  })
  it('closes only the top dialog on Escape and restores scrolling after both dialogs close', async () => {
    const bottomClose = vi.fn(),
      topClose = vi.fn()
    document.body.style.overflow = 'auto'
    function Stack() {
      const [bottom, setBottom] = useState(true),
        [top, setTop] = useState(true)
      return (
        <>
          {bottom && (
            <Modal
              title="Lớp dưới"
              onClose={() => {
                bottomClose()
                setBottom(false)
              }}
            >
              <button>Bên dưới</button>
            </Modal>
          )}
          {top && (
            <CosmeticDialog
              title="Lớp trên"
              onClose={() => {
                topClose()
                setTop(false)
              }}
            >
              <button>Bên trên</button>
            </CosmeticDialog>
          )}
        </>
      )
    }
    render(<Stack />)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(topClose).toHaveBeenCalledTimes(1)
    expect(bottomClose).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Lớp trên' })).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bottomClose).toHaveBeenCalledTimes(1)
    expect(document.body.style.overflow).toBe('auto')
  })

  it('announces the milestone and closes after 4.5 seconds, while cancelling the timer when unmounted', () => {
    vi.useFakeTimers()
    const close = vi.fn()
    const { unmount } = render(
      <MilestoneCelebration
        milestones={[{ key: 'global-10', label: 'Toàn bộ thói quen', count: 10 }]}
        onClose={close}
      />,
    )
    expect(screen.getByRole('dialog', { name: '10 ngày bền bỉ!' })).toBeTruthy()
    expect(screen.getByText('Toàn bộ thói quen · 10 ngày')).toBeTruthy()
    act(() => vi.advanceTimersByTime(4499))
    expect(close).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(close).toHaveBeenCalledTimes(1)
    unmount()
    act(() => vi.advanceTimersByTime(5000))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('allows immediate dismissal of the celebration by keyboard', () => {
    const close = vi.fn()
    const { unmount } = render(
      <MilestoneCelebration
        milestones={[{ key: 'global-30', label: 'Toàn bộ thói quen', count: 30 }]}
        onClose={close}
      />,
    )
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tiếp tục hành trình' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(close).toHaveBeenCalledTimes(1)
    unmount()
  })
})
