import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Palette,
} from 'lucide-react'
import type { Accent, AvatarId, Repository, Role, Snapshot } from './types'
import { client, CloudRepository, DemoRepository, isConfigured } from './repository'
import { defaultHabits, defaultProfile, ROLE_LABELS } from './defaults'
import { today } from './domain'
import { Avatar, avatarSrc, Button, Modal } from './ui'
import Today from './pages/Today'
import Progress from './pages/Progress'
import Goals from './pages/Goals'
import Manage from './pages/Manage'

export type Run = (action: () => Promise<void>, success?: string) => Promise<boolean>
type View = 'today' | 'progress' | 'goals' | 'manage'
function initialView(): View {
  const v = new URLSearchParams(location.search).get('view')
  return ['today', 'progress', 'goals', 'manage'].includes(v ?? '') ? (v as View) : 'today'
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
  const working = useRef(false)
  const repo = useMemo<Repository>(
    () => (demo ? new DemoRepository(role) : new CloudRepository()),
    [demo, role],
  )

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
    if (demo || hasSession) setData(await repo.load())
  }, [repo, demo, hasSession])
  useEffect(() => {
    setData(null)
    setError('')
    if (!(demo || hasSession)) return
    let active = true
    void repo
      .load()
      .then((value) => {
        if (active) setData(value)
      })
      .catch((err) => {
        if (active) setError((err as Error).message)
      })
    let timer: ReturnType<typeof setTimeout>
    const stop = repo.watch(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!working.current)
          void repo
            .load()
            .then((value) => {
              if (active) setData(value)
            })
            .catch((err) => {
              if (active) setError((err as Error).message)
            })
      }, 120)
    })
    return () => {
      active = false
      clearTimeout(timer)
      stop()
    }
  }, [repo, demo, hasSession])
  useEffect(() => {
    const focus = () => {
      setCurrentDate(today())
      if (!working.current) void reload().catch((err) => setError((err as Error).message))
    }
    const clock = setInterval(() => setCurrentDate(today()), 30000)
    window.addEventListener('focus', focus)
    return () => {
      clearInterval(clock)
      window.removeEventListener('focus', focus)
    }
  }, [reload])
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
      setBusy(true)
      setError('')
      let saved = false
      try {
        await action()
        saved = true
        setData(await repo.load())
        if (success) setToast(success)
        return true
      } catch (err) {
        setError(
          saved
            ? 'Đã lưu, nhưng chưa tải được tiến độ mới. Hãy tải lại trang để kiểm tra.'
            : `Chưa xác nhận lưu: ${(err as Error).message}`,
        )
        try {
          setData(await repo.load())
        } catch {
          /* Retain the last confirmed snapshot when refresh fails. */
        }
        return false
      } finally {
        working.current = false
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
          Góc của Conan
        </div>
        <div className="welcome-content">
          <Avatar avatar="detective" size="welcome-avatar" />
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

  const actualView = view === 'manage' && data.actor.role !== 'mentor' ? 'today' : view
  return (
    <div className="app" data-accent={data.profile.accent}>
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
              Góc của {data.profile.name}
              <small>Từng bước nhỏ, mỗi ngày</small>
            </span>
          </button>
          <nav aria-label="Điều hướng chính">
            {(
              [
                { id: 'today', label: 'Hôm nay', icon: CalendarCheck },
                { id: 'progress', label: 'Tiến độ', icon: ChartNoAxesColumnIncreasing },
                { id: 'goals', label: 'Điều em hướng tới', icon: Compass },
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
                className="icon-button"
                onClick={() => setPreferences(true)}
                aria-label="Chọn avatar và màu"
                title="Chọn avatar và màu"
              >
                <Palette size={19} />
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
          <Today
            data={data}
            repo={repo}
            run={run}
            busy={busy}
            currentDate={currentDate}
            onProgress={() => navigate('progress')}
            onGoals={() => navigate('goals')}
            onPreferences={() => setPreferences(true)}
          />
        )}
        {actualView === 'progress' && (
          <Progress data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
        {actualView === 'goals' && <Goals data={data} repo={repo} run={run} busy={busy} />}
        {actualView === 'manage' && (
          <Manage data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        )}
      </main>
      <footer className="app-footer">
        <span>Góc của {data.profile.name}</span>
        <span>Một ngày quên vẫn có thể bắt đầu lại.</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {preferences && (
        <Preferences
          data={data}
          repo={repo}
          run={run}
          busy={busy}
          onClose={() => setPreferences(false)}
        />
      )}
    </div>
  )
}

function Preferences({
  data,
  repo,
  run,
  busy,
  onClose,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  onClose: () => void
}) {
  const [avatar, setAvatar] = useState<AvatarId>(data.profile!.avatar),
    [accent, setAccent] = useState<Accent>(data.profile!.accent)
  return (
    <Modal title="Góc này là của em" onClose={onClose}>
      <p className="muted">Chọn một người đồng hành và màu em thích.</p>
      <div className="avatar-options">
        {(
          [
            { id: 'detective', label: 'Thám tử' },
            { id: 'football', label: 'Cầu thủ' },
            { id: 'builder', label: 'Nhà sáng tạo' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={avatar === item.id ? 'chosen' : ''}
            onClick={() => setAvatar(item.id)}
            aria-pressed={avatar === item.id}
          >
            <img src={avatarSrc(item.id)} alt="" />
            <span>{item.label}</span>
            {avatar === item.id && <Check size={15} />}
          </button>
        ))}
      </div>
      <span className="field-label">Màu em thích</span>
      <div className="accent-options">
        {(
          [
            { id: 'teal', label: 'Xanh ngọc' },
            { id: 'blue', label: 'Xanh dương' },
            { id: 'violet', label: 'Tím' },
            { id: 'orange', label: 'Cam' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            data-accent={item.id}
            className={accent === item.id ? 'chosen' : ''}
            aria-pressed={accent === item.id}
            onClick={() => setAccent(item.id)}
          >
            <span />
            {item.label}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <Button className="secondary" onClick={onClose}>
          Để sau
        </Button>
        <Button
          busy={busy}
          onClick={async () => {
            if (await run(() => repo.savePreferences(avatar, accent), 'Đã làm mới góc của em.'))
              onClose()
          }}
        >
          Chọn xong <Check size={16} />
        </Button>
      </div>
    </Modal>
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
          <p>Bắt đầu với bốn việc nhỏ. Bạn có thể chỉnh mốc, giờ và thêm URL ở phần quản lý.</p>
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
