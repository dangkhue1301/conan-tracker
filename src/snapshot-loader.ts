/** Coalesces invalidations during writes and prevents stale responses replacing newer ones. */
export class SnapshotLoader<T> {
  private request = 0
  private paused = false
  private pending = false
  private disposed = false
  constructor(
    private load: () => Promise<T>,
    private accept: (value: T) => void,
    private fail: (error: Error) => void,
  ) {}
  async refresh() {
    const request = ++this.request
    try {
      const value = await this.load()
      if (!this.disposed && request === this.request) this.accept(value)
    } catch (error) {
      if (!this.disposed && request === this.request) this.fail(error as Error)
      throw error
    }
  }
  invalidate() {
    if (this.disposed) return
    if (this.paused) {
      this.pending = true
      return
    }
    void this.refresh().catch(() => {})
  }
  pause() {
    this.paused = true
    ++this.request
  }
  resume() {
    this.paused = false
    if (this.pending) {
      this.pending = false
      this.invalidate()
    }
  }
  dispose() {
    this.disposed = true
    ++this.request
  }
}
