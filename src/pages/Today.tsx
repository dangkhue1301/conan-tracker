import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Sparkles,
  Target,
  Coffee,
} from 'lucide-react'
import {
  activeHabits,
  addDays,
  canEdit,
  hasMinimum,
  habitTitle,
  isCredited,
  longDate,
  planForDate,
  snapshotIndex,
  weekday,
  weeklyStats,
  weekStart,
} from '../domain'
import { HABIT_IDS, STATUS_LABELS } from '../defaults'
import type { Checkin, CheckinStatus, Habit, HabitId, Repository, Snapshot } from '../types'
import type { Run } from '../App'
import { Asset, Button, CheckMark, Empty, Modal } from '../ui'
import { MessageComposer } from './Goals'

interface Props {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  currentDate: string
  onProgress: () => void
  onGoals: () => void
  onPreferences: () => void
}
export default function Today({ data, repo, run, busy, currentDate, onProgress }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false),
    [compose, setCompose] = useState(false)
  const [photo, setPhoto] = useState<{ path: string; alt: string } | null>(null)
  const date = selectedDate ?? currentDate
  const selectDate = (value: string) => setSelectedDate(value === currentDate ? null : value)
  const index = useMemo(() => snapshotIndex(data), [data])
  const plan = planForDate(data.plans, date),
    habits = activeHabits(plan)
  const count = habits.filter((h) =>
    isCredited(index.checkins.get(`${date}:${h.id}`)?.status),
  ).length
  const stats = weeklyStats(data, weekStart(currentDate), currentDate, index)
  const messages = showAll ? data.messages : data.messages.slice(0, 3)
  const profile = data.profile
  if (!profile) return null
  return (
    <>
      <div className="today-grid">
        <section className="card checklist-card">
          <div className="checklist-heading">
            <div>
              <h1>{date === currentDate ? 'Hôm nay' : 'Việc trong ngày'}</h1>
              <p className="muted">{longDate(date)}</p>
            </div>
            <div className="day-navigation">
              <button
                className="icon-button"
                aria-label="Ngày trước"
                disabled={date <= profile.startedOn}
                onClick={() => selectDate(addDays(date, -1))}
              >
                <ChevronLeft size={18} />
              </button>
              <input
                aria-label="Chọn ngày ghi nhận"
                type="date"
                value={date}
                min={profile.startedOn}
                max={currentDate}
                onChange={(e) => {
                  if (e.target.value) selectDate(e.target.value)
                }}
              />
              <button
                className="icon-button"
                aria-label="Ngày sau"
                disabled={date >= currentDate}
                onClick={() => selectDate(addDays(date, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {selectedDate && (
            <button className="text-button back-today" onClick={() => setSelectedDate(null)}>
              Về hôm nay
            </button>
          )}
          <div className="daily-progress">
            <span>
              Đã ghi nhận{' '}
              <strong>
                {count}/{habits.length}
              </strong>{' '}
              việc
            </span>
            <div className="progress-track">
              <span style={{ width: `${habits.length ? (count / habits.length) * 100 : 0}%` }} />
            </div>
          </div>
          <DailyChecklist
            data={data}
            repo={repo}
            run={run}
            busy={busy}
            date={date}
            currentDate={currentDate}
          />
          <p className="checklist-footnote">Một việc nhỏ cũng là một lần em duy trì thói quen.</p>
        </section>
        <aside className="today-sidebar">
          <section className="card home-messages">
            <div className="aside-heading">
              <Heart size={19} />
              <h2>Lời nhắn dành cho em</h2>
            </div>
            {profile.familyPhoto && (
              <button
                className="photo-preview"
                onClick={() =>
                  setPhoto({ path: profile.familyPhoto!, alt: 'Ảnh gia đình cổ vũ em' })
                }
              >
                <Asset
                  path={profile.familyPhoto}
                  repo={repo}
                  alt="Ảnh gia đình cổ vũ em"
                  className="family-thumbnail"
                />
              </button>
            )}
            {messages.length ? (
              <div className="home-message-list">
                {messages.map((message) => (
                  <article className="home-message" key={message.id}>
                    <div className="message-byline">
                      <strong>{message.authorName}</strong>
                      <time dateTime={message.createdAt}>
                        {new Intl.DateTimeFormat('vi-VN', {
                          day: 'numeric',
                          month: 'numeric',
                          timeZone: 'Asia/Ho_Chi_Minh',
                        }).format(new Date(message.createdAt))}
                      </time>
                    </div>
                    <p>{message.body}</p>
                    {message.imagePath && (
                      <button
                        className="photo-preview"
                        onClick={() =>
                          setPhoto({
                            path: message.imagePath!,
                            alt: `Ảnh từ ${message.authorName}`,
                          })
                        }
                      >
                        <Asset
                          path={message.imagePath}
                          repo={repo}
                          alt={`Ảnh từ ${message.authorName}`}
                          className="message-thumbnail"
                        />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="message-empty">
                Lời nhắn của ba mẹ và người hướng dẫn sẽ xuất hiện ở đây.
              </p>
            )}
            {data.messages.length > 3 && (
              <button className="text-button" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            )}
            {data.actor.role !== 'learner' && (
              <>
                <button
                  className="button secondary compose-toggle"
                  onClick={() => setCompose(!compose)}
                  aria-expanded={compose}
                >
                  {compose ? 'Thu gọn ô viết' : 'Viết lời nhắn'}
                </button>
                <div hidden={!compose}>
                  <MessageComposer repo={repo} run={run} busy={busy} />
                </div>
              </>
            )}
          </section>
          <section className="card weekly-peek">
            <div className="aside-heading">
              <Target size={18} />
              <h2>Tuần này</h2>
            </div>
            <p className="weekly-count">
              <strong>{stats.credited}</strong> / {stats.planned} lượt duy trì
            </p>
            <div className="progress-track">
              <span style={{ width: `${stats.rate ?? 0}%` }} />
            </div>
            <p className="muted">Mốc tham khảo: {stats.target} lượt · 80%</p>
            <button className="text-button" onClick={onProgress}>
              Xem bảng tuần <ArrowUpRight size={16} />
            </button>
          </section>
        </aside>
      </div>
      {photo && (
        <Modal title={photo.alt} onClose={() => setPhoto(null)}>
          <Asset path={photo.path} repo={repo} alt={photo.alt} className="full-photo" />
        </Modal>
      )}
    </>
  )
}

export function DailyChecklist({
  data,
  repo,
  run,
  busy,
  date,
  currentDate,
  onlyHabit,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  date: string
  currentDate: string
  onlyHabit?: HabitId
}) {
  const [openMenu, setOpenMenu] = useState<HabitId | null>(null)
  const index = useMemo(() => snapshotIndex(data), [data])
  const plan = planForDate(data.plans, date),
    active = new Set(activeHabits(plan).map((h) => h.id))
  const habits = HABIT_IDS.filter((id) => !onlyHabit || id === onlyHabit)
    .map((id) => plan?.habits.find((h) => h.id === id))
    .filter((h): h is Habit => !!h)
  const excuse = index.excuses.get(date)
  if (!data.profile || date < data.profile.startedOn)
    return (
      <Empty
        icon={<Clock3 size={26} />}
        title="Chưa bắt đầu theo dõi"
        text="Các ngày trước ngày bắt đầu không tính vào tiến độ."
      />
    )
  if (excuse)
    return (
      <div className="rest-day">
        <Coffee size={30} />
        <h3>Hôm nay được nghỉ</h3>
        <p>{excuse.reason}</p>
        <small>Ngày này không tính vào mục tiêu tuần.</small>
      </div>
    )
  if (!habits.length)
    return (
      <Empty
        icon={<BookOpen size={26} />}
        title="Chưa có kế hoạch cho ngày này"
        text="Người hướng dẫn sẽ chọn ngày bắt đầu."
      />
    )
  const editable = canEdit(data.actor.role, date, currentDate)
  return (
    <>
      {!editable && (
        <p className="read-only-note">
          {data.actor.role === 'parent'
            ? 'Ba mẹ đang xem tiến độ.'
            : date > currentDate
              ? 'Ngày này chưa đến.'
              : 'Tuần cũ được xem lại cùng người hướng dẫn.'}
        </p>
      )}
      <div className="habit-list">
        {habits.map((habit) =>
          active.has(habit.id) ? (
            <HabitRow
              key={`${date}-${habit.id}`}
              habit={{ ...habit, title: habitTitle(habit) }}
              date={date}
              check={index.checkins.get(`${date}:${habit.id}`)}
              data={data}
              repo={repo}
              run={run}
              busy={busy}
              editable={editable}
              menuOpen={openMenu === habit.id}
              onMenu={(open) => setOpenMenu(open ? habit.id : null)}
            />
          ) : (
            <div className="habit-row unscheduled" key={habit.id}>
              <div className="habit-main">
                <button
                  className="habit-checkbox"
                  role="checkbox"
                  aria-checked={false}
                  aria-label={`${habitTitle(habit)}: Chưa áp dụng`}
                  disabled
                >
                  <CheckMark checked={false} />
                </button>
                <div className="habit-content">
                  <h4>{habitTitle(habit)}</h4>
                  <p>Chưa áp dụng vào ngày này</p>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </>
  )
}
function HabitRow({
  habit,
  date,
  data,
  repo,
  run,
  busy,
  editable,
  check,
  menuOpen,
  onMenu,
}: {
  habit: Habit
  date: string
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  editable: boolean
  check?: Checkin
  menuOpen: boolean
  onMenu: (open: boolean) => void
}) {
  const status = check?.status ?? 'not_started'
  const [note, setNote] = useState(check?.note ?? ''),
    [dirty, setDirty] = useState(false),
    [baseVersion, setBaseVersion] = useState(check?.version ?? 0),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false),
    [feedback, setFeedback] = useState('')
  const input = useRef<HTMLTextAreaElement>(null),
    schedule = habit.schedule[String(weekday(date))]
  useEffect(() => {
    if (!dirty) {
      setNote(check?.note ?? '')
      setBaseVersion(check?.version ?? 0)
    }
  }, [check?.note, check?.version, dirty])
  const menu = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  useLayoutEffect(() => {
    if (!menuOpen) return
    const placeMenu = () => {
      const anchor = trigger.current,
        options = menu.current?.querySelector<HTMLElement>('[role=menu]')
      if (!anchor || !options) return
      const rect = anchor.getBoundingClientRect()
      const scrollRegion = anchor.closest('.modal-content')?.getBoundingClientRect()
      const top = Math.max(8, scrollRegion?.top ?? 0),
        bottom = Math.min(window.innerHeight - 8, scrollRegion?.bottom ?? window.innerHeight),
        left = Math.max(8, scrollRegion?.left ?? 0),
        right = Math.min(window.innerWidth - 8, scrollRegion?.right ?? window.innerWidth)
      const below = bottom - rect.bottom - 6,
        above = rect.top - top - 6,
        height = options.scrollHeight + 2,
        up = below < height && above > below,
        width = Math.min(232, right - left)
      setMenuStyle({
        width,
        left: Math.max(left - rect.left, Math.min(rect.width - width, right - rect.left - width)),
        right: 'auto',
        top: up ? 'auto' : 'calc(100% + 6px)',
        bottom: up ? 'calc(100% + 6px)' : 'auto',
        maxHeight: Math.max(58, up ? above : below),
      })
    }
    placeMenu()
    window.addEventListener('resize', placeMenu)
    document.addEventListener('scroll', placeMenu, true)
    return () => {
      window.removeEventListener('resize', placeMenu)
      document.removeEventListener('scroll', placeMenu, true)
    }
  }, [menuOpen])
  useEffect(() => {
    if (!menuOpen) return
    menu.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus()
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) onMenu(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onMenu(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [menuOpen, onMenu])
  const conflict = dirty && baseVersion !== (check?.version ?? 0)
  const save = async (next: CheckinStatus) => {
    setError('')
    setFeedback('')
    if (habit.id === 'review' && next !== 'not_started' && !note.trim()) {
      setError('Ghi một dòng về điều em đã ôn trước nhé.')
      input.current?.focus()
      return
    }
    if (conflict) {
      setError('Ghi chú đã được sửa ở nơi khác. Chọn bản muốn giữ trước khi lưu.')
      return
    }
    const praise =
      next === 'extra'
        ? `Em đã làm thêm ở mục “${habit.title}”. Rất đáng ghi nhận!`
        : next === 'minimum'
          ? 'Em đã dành thời gian bắt đầu. Mình ghi nhận nhé.'
          : next === 'done'
            ? `Đã làm đủ “${habit.title}”. Thêm một bước nhỏ!`
            : 'Đã cập nhật lại.'
    setSaving(true)
    try {
      const saved = await run(
        () =>
          repo.saveCheckin({
            date,
            habitId: habit.id,
            status: next,
            note,
            expectedVersion: dirty ? baseVersion : (check?.version ?? 0),
          }),
        data.actor.role === 'learner' ? praise : 'Đã cập nhật kết quả.',
      )
      if (saved) {
        setDirty(false)
        setFeedback('Đã lưu')
      } else setError('Chưa xác nhận kết quả. Xem thông báo phía trên và thử lại.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className={`habit-row ${isCredited(status) ? 'completed' : ''}`}>
      <div className="habit-main">
        <button
          role="checkbox"
          aria-checked={status === 'minimum' ? 'mixed' : isCredited(status)}
          aria-label={`${habit.title}: ${STATUS_LABELS[status]}`}
          className="habit-checkbox"
          disabled={!editable || busy}
          onClick={() =>
            void save(status === 'done' || status === 'extra' ? 'not_started' : 'done')
          }
        >
          <CheckMark
            checked={status === 'done' || status === 'extra'}
            partial={status === 'minimum'}
          />
        </button>
        <div className="habit-content">
          <div className="habit-title">
            <h4>
              {habit.url ? (
                <a href={habit.url} target="_blank" rel="noopener noreferrer">
                  {habit.title} <ArrowUpRight size={13} />
                </a>
              ) : (
                habit.title
              )}
            </h4>
            {status === 'extra' && (
              <span className="extra-star" title="Em đã làm thêm">
                <Sparkles size={14} />
              </span>
            )}
          </div>
          <p className="habit-meta">
            <span>
              {habit.target} {habit.unit}
            </span>
            {schedule?.subject && (
              <>
                <span className="separator" aria-hidden="true">
                  ·
                </span>
                <span>{schedule.subject}</span>
              </>
            )}
            {schedule?.time && (
              <>
                <span className="separator" aria-hidden="true">
                  ·
                </span>
                <span className="habit-time">
                  <Clock3 size={14} aria-hidden="true" />
                  <time>{schedule.time}</time>
                </span>
              </>
            )}
          </p>
        </div>
        <div className="habit-actions">
          {editable ? (
            <div className="status-menu" ref={menu}>
              <button
                ref={trigger}
                className={`status-badge ${status}`}
                aria-label={`Chọn mức cho ${habit.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                disabled={busy}
                onClick={() => onMenu(!menuOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    onMenu(true)
                  }
                }}
              >
                {status === 'not_started' ? 'Mức khác' : STATUS_LABELS[status]}
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div
                  className="status-options"
                  style={menuStyle}
                  role="menu"
                  aria-label={`Mức cho ${habit.title}`}
                  onKeyDown={(e) => {
                    const items = Array.from(
                      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]'),
                    )
                    const i = items.indexOf(document.activeElement as HTMLButtonElement)
                    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                      e.preventDefault()
                      items[
                        e.key === 'Home'
                          ? 0
                          : e.key === 'End'
                            ? items.length - 1
                            : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
                      ]?.focus()
                    }
                    if (e.key === 'Tab') onMenu(false)
                  }}
                >
                  {(
                    [
                      'done',
                      ...(hasMinimum(habit) ? ['minimum'] : []),
                      'extra',
                      'not_started',
                    ] as CheckinStatus[]
                  ).map((value) => (
                    <button
                      role="menuitem"
                      key={value}
                      disabled={busy}
                      onClick={() => {
                        onMenu(false)
                        trigger.current?.focus()
                        void save(value)
                      }}
                    >
                      <span>
                        {value === 'minimum'
                          ? `Ít nhất ${habit.minimum} ${habit.unit}`
                          : value === 'done'
                            ? `Làm đủ ${habit.target} ${habit.unit}`
                            : STATUS_LABELS[value]}
                      </span>
                      {value === status && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className={`status-badge ${status}`}>{STATUS_LABELS[status]}</span>
          )}
        </div>
      </div>
      {habit.id === 'writing' && (
        <p className="habit-tip">Gợi ý: kể, tả, cảm nghĩ và một từ mới em vừa đọc.</p>
      )}
      {habit.id === 'review' && (
        <div className="review-note">
          <label htmlFor={`note-${date}`}>Hôm nay em đã ôn gì?</label>
          <textarea
            id={`note-${date}`}
            ref={input}
            value={note}
            disabled={!editable || busy}
            maxLength={500}
            rows={2}
            placeholder="Ví dụ: sửa 3 bài sai về phân số, giải thích lại cách làm."
            onChange={(e) => {
              if (!dirty) setBaseVersion(check?.version ?? 0)
              setDirty(true)
              setNote(e.target.value)
            }}
          />
          {conflict && (
            <div className="note-conflict">
              <p>Ghi chú mới ở nơi khác: {check?.note || '(trống)'}</p>
              <button
                onClick={() => {
                  setNote(check?.note ?? '')
                  setDirty(false)
                }}
                className="text-button"
              >
                Dùng ghi chú mới
              </button>
              <button onClick={() => setBaseVersion(check?.version ?? 0)} className="text-button">
                Giữ bản đang nhập
              </button>
            </div>
          )}
          {dirty && (
            <div className="note-save">
              <span>Chưa lưu ghi chú</span>
              <Button busy={busy} className="secondary small" onClick={() => void save(status)}>
                Lưu ghi chú
              </Button>
            </div>
          )}
        </div>
      )}
      {(saving || feedback) && <p className="row-feedback">{saving ? 'Đang lưu…' : feedback}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
