import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CloudRepository, DemoRepository, demoSnapshot } from '../src/repository'
import { emptyGameState, gameStats } from '../src/gamification'
import type { Role, Snapshot } from '../src/types'

let values: Map<string, string>
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value)
  },
}
const repo = (role: Role = 'learner') => new DemoRepository(role, storage, () => '2026-10-14')
function seed() {
  const data = demoSnapshot('learner', '2026-10-14')
  data.game = emptyGameState()
  values.set('conan-tracker-demo-v1', JSON.stringify(data))
  return data
}
beforeEach(() => {
  values = new Map()
})

describe('demo game state persistence and permissions', () => {
  it('keeps Coin independent from XP and owns purchases permanently, with duplicate retries harmless', async () => {
    seed()
    const before = await repo().load()
    await repo().gameAction({ type: 'buy', itemId: 'frame-flame-1' })
    await repo().gameAction({ type: 'buy', itemId: 'frame-flame-1' })
    await repo().gameAction({ type: 'equip', category: 'frame', itemId: 'frame-flame-1' })
    const after = await repo('mentor').load()
    expect(after.game!.spentCoins).toBe(100)
    expect(after.game!.inventory.filter((i) => i === 'frame-flame-1')).toHaveLength(1)
    expect(after.game!.equipped.frame).toBe('frame-flame-1')
    expect(gameStats(after, '2026-10-14').xp).toBe(gameStats(before, '2026-10-14').xp)
    expect(gameStats(after, '2026-10-14').coins).toBe(gameStats(before, '2026-10-14').coins - 100)
    await expect(
      repo('parent').gameAction({ type: 'buy', itemId: 'frame-football-1' }),
    ).rejects.toThrow('Conan')
    await expect(
      repo().gameAction({ type: 'equip', category: 'pet', itemId: 'frame-flame-1' }),
    ).rejects.toThrow('phù hợp')
    await expect(repo().gameAction({ type: 'buy', itemId: 'frame-flame-5' })).rejects.toThrow(
      'điều kiện',
    )
  })
  it('keeps milestones and message reads private to each demo role', async () => {
    seed()
    await repo('parent').saveMessage('Ba mẹ tin em', null)
    const message = (await repo().load()).messages[0]
    await repo().gameAction({ type: 'read', ids: [message.id] })
    await repo().gameAction({ type: 'seen', keys: ['global:10'] })
    expect((await repo().load()).game!.readMessageIds).toEqual([message.id])
    expect((await repo('parent').load()).game!.readMessageIds).toEqual([])
    expect((await repo('mentor').load()).game!.seenMilestones).toEqual([])
    expect((await repo().load()).game!.seenMilestones).toEqual(['global:10'])
  })
  it('requires mentor review for repair and validates gift/avatars as cloud does', async () => {
    const data = seed()
    data.checkins = data.checkins.filter((c) => c.date !== '2026-10-13')
    values.set('conan-tracker-demo-v1', JSON.stringify(data))
    await repo().gameAction({
      type: 'repair-request',
      date: '2026-10-13',
      reason: 'Quên',
      prevention: 'Đặt nhắc',
    })
    const request = (await repo().load()).game!.repairs[0]
    await expect(
      repo('parent').gameAction({ type: 'repair-review', id: request.id, approve: true }),
    ).rejects.toThrow('người hướng dẫn')
    await repo('mentor').gameAction({ type: 'repair-review', id: request.id, approve: true })
    expect((await repo().load()).game!.repairs[0].status).toBe('approved')
    await expect(
      repo().gameAction({ type: 'prize-request', month: '2026-10', title: 'Ăn pizza' }),
    ).rejects.toThrow('chưa đủ')
    await expect(
      repo().gameAction({ type: 'avatar', path: 'https://untrusted.example/avatar.png' }),
    ).rejects.toThrow('tải lên')
    await expect(
      repo('parent').uploadAvatar({ type: 'image/png', size: 100 } as File),
    ).rejects.toThrow('Conan')
  })
  it('settles the previous joined league once and leaves inactive tiers unchanged', async () => {
    const data = seed()
    data.game!.league = { tier: 5, joinedWeek: '2026-10-05', history: [] }
    data.checkins = []
    values.set('conan-tracker-demo-v1', JSON.stringify(data))
    const first = await repo().load(),
      again = await repo().load()
    expect(first.game!.league.tier).toBe(5)
    expect(first.game!.league.history[0]).toMatchObject({ xp: 0, result: 'stayed' })
    expect(again.game!.league).toEqual(first.game!.league)
    await repo().gameAction({ type: 'league-join' })
    expect((await repo().load()).game!.league.joinedWeek).toBe('2026-10-12')
  })
})

describe('cloud game transport', () => {
  it('passes only the structured action to server and returns server-authoritative snapshot', async () => {
    const snapshot = { ...demoSnapshot(), game: emptyGameState() } as Snapshot
    const rpc = vi.fn().mockResolvedValue({ data: snapshot, error: null })
    const repository = new CloudRepository({ rpc } as unknown as SupabaseClient)
    await repository.gameAction({ type: 'buy', itemId: 'frame-flame-1' })
    expect(rpc).toHaveBeenCalledWith('game_action', {
      p_action: { type: 'buy', itemId: 'frame-flame-1' },
    })
    expect(await repository.load()).toEqual(snapshot)
  })
  it('uploads static avatars to the separate private bucket and signs access for one hour', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'signed-avatar' }, error: null })
    const from = vi.fn().mockReturnValue({ upload, createSignedUrl })
    const repository = new CloudRepository({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      storage: { from },
    } as unknown as SupabaseClient)
    const file = { type: 'image/webp', size: 100 } as File
    const path = await repository.uploadAvatar(file)
    expect(path).toMatch(/^user-1\/[a-f0-9-]+\.webp$/)
    expect(from).toHaveBeenCalledWith('avatar-assets')
    expect(upload).toHaveBeenCalledWith(path, file, { contentType: 'image/webp', upsert: false })
    expect(await repository.avatarUrl(path)).toBe('signed-avatar')
    expect(createSignedUrl).toHaveBeenCalledWith(path, 3600)
    await expect(repository.uploadAvatar({ type: 'image/gif', size: 100 } as File)).rejects.toThrow(
      'JPG',
    )
  })
  it('surfaces server failures without fabricating local currency or success', async () => {
    const repository = new CloudRepository({
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Em chưa đủ Coin.', code: 'P0001' } }),
    } as unknown as SupabaseClient)
    await expect(repository.gameAction({ type: 'buy', itemId: 'frame-flame-1' })).rejects.toThrow(
      'Coin',
    )
  })
})
