import { describe, expect, it, vi } from 'vitest'
import { SnapshotLoader } from '../src/snapshot-loader'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
describe('snapshot updates', () => {
  it('drains invalidations received during a write', async () => {
    const accept = vi.fn(),
      load = vi.fn().mockResolvedValue('new')
    const loader = new SnapshotLoader(load, accept, vi.fn())
    loader.pause()
    loader.invalidate()
    expect(load).not.toHaveBeenCalled()
    loader.resume()
    await Promise.resolve()
    expect(accept).toHaveBeenCalledWith('new')
  })
  it('rejects stale responses and responses from an abandoned session', async () => {
    const first = deferred<string>(),
      second = deferred<string>(),
      accept = vi.fn()
    const loader = new SnapshotLoader(
      vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
      accept,
      vi.fn(),
    )
    const old = loader.refresh(),
      recent = loader.refresh()
    second.resolve('recent')
    await recent
    first.resolve('old')
    await old
    expect(accept.mock.calls).toEqual([['recent']])
    const pending = deferred<string>()
    const disposed = new SnapshotLoader(() => pending.promise, accept, vi.fn())
    const request = disposed.refresh()
    disposed.dispose()
    pending.resolve('other user')
    await request
    expect(accept.mock.calls).toEqual([['recent']])
  })
})
