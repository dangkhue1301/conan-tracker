import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  Compass,
  LogOut,
  Settings2,
  Sparkles,
  RefreshCw,
  LoaderCircle,
  Moon,
  Sun,
  ShoppingBag,
  Trophy,
} from 'lucide-react'
import type { Repository, Role, Snapshot } from './types'
import { client, CloudRepository, DemoRepository, isConfigured } from './repository'
import { defaultHabits, defaultProfile, ROLE_LABELS } from './defaults'
import { today } from './domain'
import { Button } from './ui'
import { SnapshotLoader } from './snapshot-loader'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Goals from './pages/Goals'
import Manage from './pages/Manage'
import { AvatarStudio, MilestoneCelebration, ProfileAvatar } from './cosmetics'
import { gameState, streakMilestones, type StreakMilestone } from './gamification'
import { League, MonthlyRewards } from './pages/GameExtras'
import MessageBubble from './MessageBubble'

const Shop = lazy(() => import('./pages/Shop'))

export type Run = (action: () => Promise<void>, success?: string) => Promise<boolean>
type View = 'today' | 'progress' | 'goals' | 'manage' | 'shop' | 'league'
function initialView(): View {
  const v = new URLSearchParams(location.search).get('view')
  return ['today', 'progress', 'goals', 'manage', 'shop', 'league'].includes(v ?? '')
    ? (v as View)
    : 'today'
}

export default function App() {
  const [demo, setDemo] = useState(new URLSearchParams(location.search).get('demo') === '1')
  const [role, setRole] = useState<Role>('learner'),
    [hasSession, setHasSession] = useState(false)
  const [authReady, setAuthReady] = useState(!client),
    [authBusy, setAuthBusy] = useState(false)
  const [data, setData] = useState<Snapshot | null>(null),
    [view, setView] = useState<View>(initialView)
  const [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [busy, setBusy] = useState(false)
  const [currentDate, setCurrentDate] = useState(today()),
    [preferences, setPreferences] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('conanhabit-theme') === 'dark' ? 'dark' : 'light',
  )
  const [shopTab, setShopTab] = useState<'cosmetics' | 'monthly'>('cosmetics')
  const [celebration, setCelebration] = useState<StreakMilestone[] | null>(null)
  const dismissedMilestones = useRef(new Set<string>())
  const working = useRef(false)
  const loader = useRef<SnapshotLoader<Snapshot> | null>(null)
  const repo = useMemo<Repository>(
    () => (demo ? new DemoRepository(role) : new CloudRepository()),
    [demo, role],
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('conanhabit-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#111425' : '#6366f1')
  }, [theme])
  useEffect(() => {
    dismissedMilestones.current.clear()
    setCelebration(null)
  }, [repo, hasSession])
  useEffect(() => {
    if (!data?.profile || data.actor.role !== 'learner') return
    const next = streakMilestones(data, currentDate).filter(
      (m) => !dismissedMilestones.current.has(m.key),
    )
    if (next.length) setCelebration(next)
  }, [data, currentDate])

  useEffect(() => {
    if (!client) return
    void client.auth.getSession().then(({ data: session, error: authError }) => {
      setHasSession(!!session.session)
      setAuthReady(true)
      if (authError) setError(authError.message)
    })
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session)
      setAuthReady(true)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])
  const reload = useCallback(async () => {
    await loader.current?.refresh()
  }, [])
  useEffect(() => {
    setData(null)
    setError('')
    if (!(demo || hasSession)) return
    const loading = new SnapshotLoader(
      () => repo.load(),
      setData,
      (err) => setError(err.message),
    )
    loader.current = loading
    void loading.refresh().catch(() => {})
    let timer: ReturnType<typeof setTimeout>
    const stop = repo.watch(() => {
      clearTimeout(timer)
      timer = setTimeout(() => loading.invalidate(), 120)
    })
    return () => {
      loading.dispose()
      if (loader.current === loading) loader.current = null
      clearTimeout(timer)
      stop()
    }
  }, [repo, demo, hasSession])
  useEffect(() => {
    const focus = () => {
      setCurrentDate(today())
      loader.current?.invalidate()
    }
    const clock = setInterval(() => setCurrentDate(today()), 30000)
    window.addEventListener('focus', focus)
    return () => {
      clearInterval(clock)
      window.removeEventListener('focus', focus)
    }
  }, [reload])
  useEffect(() => {
    loader.current?.invalidate()
  }, [currentDate])
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    const pop = () => setView(initialView())
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  const navigate = (next: View) => {
    setView(next)
    const url = new URL(location.href)
    url.searchParams.set('view', next)
    history.pushState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const enterDemo = () => {
    const url = new URL(location.href)
    url.searchParams.set('demo', '1')
    history.replaceState(null, '', url)
    setDemo(true)
  }
  const exit = async () => {
    if (demo) {
      const url = new URL(location.href)
      url.searchParams.delete('demo')
      url.searchParams.delete('view')
      history.replaceState(null, '', url)
      setDemo(false)
      setView('today')
    } else await client?.auth.signOut({ scope: 'local' })
    setData(null)
  }
  const signIn = async () => {
    if (!client) return
    setAuthBusy(true)
    setError('')
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: new URL(import.meta.env.BASE_URL, location.origin).href },
    })
    if (authError) {
      setError(authError.message)
      setAuthBusy(false)
    }
  }
  const run: Run = useCallback(
    async (action, success = 'Đã lưu.') => {
      if (working.current) return false
      working.current = true
      const loading = loader.current
      loading?.pause()
      setBusy(true)
      setError('')
      let saved = false
      try {
        await action()
        saved = true
        await loading?.refresh()
        if (success) setToast(success)
        return true
      } catch (err) {
        setError(
          saved
            ? 'Đã lưu, nhưng chưa tải được tiến độ mới. Hãy tải lại trang để kiểm tra.'
            : `Chưa xác nhận lưu: ${(err as Error).message}`,
        )
        try {
          await loading?.refresh()
        } catch {
          /* Retain the last confirmed snapshot when refresh fails. */
        }
        return false
      } finally {
        working.current = false
        loading?.resume()
        setBusy(false)
      }
    },
    [repo],
  )

  if (!authReady)
    return (
      <div className="loading-page">
        <LoaderCircle className="spin" />
        <p>Đang mở góc học tập…</p>
      </div>
    )
  if (!demo && !hasSession)
    return (
      <div className="welcome-page">
        <div className="welcome-brand">
          <span className="brand-mark">
            <Check />
          </span>{' '}
          ConanHabit
        </div>
        <div className="welcome-content">
          <span className="welcome-habit-emblem">
            <Sparkles size={48} />
          </span>
          <p className="eyebrow">TỪNG VIỆC NHỎ, MỖI NGÀY MỘT CHÚT</p>
          <h1>
            Hôm nay, mình
            <br />
            bắt đầu từ đâu?
          </h1>
          <p>
            Nhớ việc cần làm, ghi nhận những lần cố gắng
            <br className="desktop-only" /> và nhìn thấy mình đang tiến bộ.
          </p>
          {isConfigured ? (
            <Button busy={authBusy} onClick={() => void signIn()} className="google-button">
              <span className="google-g">G</span>Tiếp tục với Google
              <ChevronRight size={17} />
            </Button>
          ) : (
            <p className="welcome-note">Góc học tập đang chờ người hướng dẫn kết nối tài khoản.</p>
          )}
          <button className="demo-link" onClick={enterDemo}>
            Xem bản minh hoạ <ChevronRight size={15} />
          </button>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <p className="welcome-footer">Một góc nhỏ dành cho sự cố gắng của em.</p>
      </div>
    )
  if (!data)
    return (
      <div className="loading-page">
        {error ? (
          <>
            <BookOpen size={34} />
            <h2>Chưa mở được góc học tập</h2>
            <p role="alert">{error}</p>
            <p className="muted">
              Nếu tài khoản chưa được phép, nhờ người hướng dẫn thêm email Google của bạn.
            </p>
            <div className="button-row">
              <Button
                onClick={() => {
                  setError('')
                  void reload().catch((err) => setError((err as Error).message))
                }}
              >
                <RefreshCw size={16} />
                Thử lại
              </Button>
              <Button className="secondary" onClick={() => void exit()}>
                Đăng xuất
              </Button>
            </div>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Đang lấy tiến độ…</p>
          </>
        )}
      </div>
    )
  if (!data.profile)
    return (
      <InitialSetup
        data={data}
        repo={repo}
        run={run}
        busy={busy}
        error={error}
        onExit={() => void exit()}
      />
    )

  if (!data.plans.length || !data.plans.some((p) => p.effectiveFrom <= currentDate))
    return (
      <div className="loading-page">
        <BookOpen />
        <h2>Chưa có lịch học đang áp dụng</h2>
        <p>Nhờ người hướng dẫn kiểm tra lịch học trước khi ghi nhận.</p>
        <Button className="secondary" onClick={() => void reload().catch(() => {})}>
          Tải lại lịch
        </Button>
        <Button className="secondary" onClick={() => void exit()}>
          Đăng xuất
        </Button>
      </div>
    )
  const actualView = view === 'manage' && data.actor.role !== 'mentor' ? 'today' : view
  return (
    <div className="app">
      {demo && (
        <div className="demo-banner">
          <span>
            <Sparkles size={14} /> Bản minh hoạ · dữ liệu mẫu chỉ lưu trên máy này
          </span>
          <label>
            Xem vai{' '}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role)
                setView('today')
              }}
              aria-label="Vai trong bản minh hoạ"
            >
              <option value="learner">Conan</option>
              <option value="mentor">Người hướng dẫn</option>
              <option value="parent">Ba mẹ</option>
            </select>
          </label>
        </div>
      )}
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate('today')}>
            <span className="brand-mark">
              <Check size={22} strokeWidth={3} />
            </span>
            <span>
              Conan<span className="brand-habit">Habit</span>
            </span>
          </button>
          <nav aria-label="Điều hướng chính">
            {(
              [
                { id: 'today', label: 'Hôm nay', icon: CalendarCheck },
                { id: 'progress', label: 'Tiến độ', icon: ChartNoAxesColumnIncreasing },
                { id: 'goals', label: 'Mục tiêu', icon: Compass },
                { id: 'shop', label: 'Shop', icon: ShoppingBag },
                { id: 'league', label: 'Giải đấu', icon: Trophy },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                className={actualView === item.id ? 'active' : ''}
                onClick={() => navigate(item.id)}
                aria-current={actualView === item.id ? 'page' : undefined}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Bật giao diện tối' : 'Bật giao diện sáng'}
              title={theme === 'light' ? 'Giao diện tối' : 'Giao diện sáng'}
            >
              {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            {data.actor.role === 'mentor' && (
              <button
                className={`icon-button ${actualView === 'manage' ? 'selected' : ''}`}
                onClick={() => navigate('manage')}
                title="Quản lý"
                aria-label="Quản lý"
              >
                <Settings2 size={19} />
              </button>
            )}
            {data.actor.role !== 'parent' && (
              <button
                className="icon-button profile-trigger"
                onClick={() => setPreferences(true)}
                aria-label="Chỉnh hồ sơ và avatar"
                title="Hồ sơ của Conan"
              >
                <ProfileAvatar data={data} repo={repo} size="small" />
              </button>
            )}
            <span className="role-pill">{ROLE_LABELS[data.actor.role]}</span>
            <button
              className="icon-button"
              onClick={() => void exit()}
              aria-label={demo ? 'Thoát bản minh hoạ' : 'Đăng xuất'}
              title={demo ? 'Thoát bản minh hoạ' : 'Đăng xuất'}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={() => setError('')}>
              Đóng
            </button>
          </div>
        )}
        {actualView === 'today' && (
          <Dashboard data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
        {actualView === 'progress' && (
          <Progress data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
        {actualView === 'goals' && <Goals data={data} repo={repo} run={run} busy={busy} />}
        {actualView === 'shop' && (
          <>
            <div className="shop-main-tabs" role="group" aria-label="Nội dung Shop">
              <button
                className={shopTab === 'cosmetics' ? 'active' : ''}
                onClick={() => setShopTab('cosmetics')}
              >
                <ShoppingBag size={17} />
                Đồ của em
              </button>
              <button
                className={shopTab === 'monthly' ? 'active' : ''}
                onClick={() => setShopTab('monthly')}
              >
                <Sparkles size={17} />
                Quà tháng
              </button>
            </div>
            {shopTab === 'cosmetics' ? (
              <Suspense
                fallback={
                  <div className="loading-page">
                    <LoaderCircle className="spin" />
                    <p>Đang mở Shop…</p>
                  </div>
                }
              >
                <Shop data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
              </Suspense>
            ) : (
              <MonthlyRewards
                data={data}
                repo={repo}
                run={run}
                busy={busy}
                currentDate={currentDate}
              />
            )}
          </>
        )}
        {actualView === 'league' && (
          <League data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
        {actualView === 'manage' && (
          <Manage data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
      </main>
      <footer className="app-footer">
        <span>ConanHabit</span>
        <span>Một ngày quên vẫn có thể bắt đầu lại.</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {preferences && (
        <AvatarStudio
          data={data}
          repo={repo}
          run={run}
          busy={busy}
          onClose={() => setPreferences(false)}
        />
      )}
      <MessageBubble data={data} repo={repo} run={run} busy={busy} />
      {celebration && (
        <MilestoneCelebration
          milestones={celebration}
          styleId={gameState(data).equipped.celebration}
          onClose={() => {
            const keys = celebration.map((m) => m.key)
            keys.forEach((k) => dismissedMilestones.current.add(k))
            setCelebration(null)
            void run(async () => {
              for (let i = 0; i < keys.length; i += 200)
                await repo.gameAction({ type: 'seen', keys: keys.slice(i, i + 200) })
            }, '')
          }}
        />
      )}
    </div>
  )
}

function InitialSetup({
  data,
  repo,
  run,
  busy,
  error,
  onExit,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  error: string
  onExit: () => void
}) {
  const [profile, setProfile] = useState(defaultProfile())
  return (
    <div className="setup-page">
      <span className="brand-mark">
        <Check />
      </span>
      <h1>Chào mừng đến góc học tập</h1>
      {data.actor.role === 'mentor' ? (
        <form
          className="card setup-card"
          onSubmit={async (e) => {
            e.preventDefault()
            await run(() => repo.initialize(profile, defaultHabits()), 'Đã mở góc học tập.')
          }}
        >
          <p>Bắt đầu với bảy việc nhỏ. Bạn có thể chỉnh mốc, giờ và thêm URL ở phần quản lý.</p>
          <label>
            Tên gọi
            <input
              value={profile.name}
              maxLength={60}
              required
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label>
            Ngày bắt đầu theo dõi
            <input
              type="date"
              value={profile.startedOn}
              max={today()}
              required
              onChange={(e) => setProfile({ ...profile, startedOn: e.target.value })}
            />
          </label>
          <Button type="submit" busy={busy}>
            Mở góc học tập <ChevronRight size={16} />
          </Button>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <p>Người hướng dẫn sẽ thiết lập lịch và ngày bắt đầu trước khi em ghi nhận.</p>
      )}
      <button className="text-button" onClick={onExit}>
        Đăng xuất
      </button>
    </div>
  )
}
