import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Moon,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Coffee,
} from 'lucide-react'
import {
  activeHabits,
  addDays,
  canEdit,
  currentPeriod,
  hasMinimum,
  isCredited,
  longDate,
  planForDate,
  weekday,
  weeklyStats,
  weekStart,
} from '../domain'
import { STATUS_LABELS } from '../defaults'
import type { CheckinStatus, Habit, Repository, Snapshot } from '../types'
import type { Run } from '../App'
import { Asset, Avatar, Button, CheckMark, Empty } from '../ui'

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
export default function Today({
  data,
  repo,
  run,
  busy,
  currentDate,
  onProgress,
  onGoals,
  onPreferences,
}: Props) {
  const [date, setDate] = useState(currentDate),
    previousToday = useRef(currentDate)
  useEffect(() => {
    if (date === previousToday.current) setDate(currentDate)
    previousToday.current = currentDate
  }, [currentDate, date])
  const plan = planForDate(data.plans, date),
    habits = activeHabits(plan)
  const count = habits.filter((h) =>
    isCredited(data.checkins.find((c) => c.date === date && c.habitId === h.id)?.status),
  ).length
  const stats = weeklyStats(data, weekStart(currentDate), currentDate)
  const yesterday = addDays(currentDate, -1),
    wasMissing = activeHabits(planForDate(data.plans, yesterday)).some(
      (h) =>
        !isCredited(data.checkins.find((c) => c.date === yesterday && c.habitId === h.id)?.status),
    )
  const message = data.messages[0],
    goal = data.goals[0],
    reward = data.rewards.find((r) => r.visible)
  const isToday = date === currentDate
  return (
    <>
      <section className="today-hero">
        <div>
          <p className="eyebrow">{longDate(date)}</p>
          <h1>
            {isToday ? `Chào ${data.profile!.name},` : 'Cùng nhìn lại ngày này,'}
            <br />
            <span>{isToday ? 'mình làm từng việc nhé.' : longDate(date)}</span>
          </h1>
          <p>
            {isToday && wasMissing
              ? 'Hôm nay là một cơ hội để bắt đầu lại.'
              : 'Mỗi lần bắt đầu là một bước tiến của em.'}
          </p>
        </div>
        <div className="hero-avatar">
          <Avatar
            avatar={data.profile!.avatar}
            size="large"
            onClick={data.actor.role !== 'parent' ? onPreferences : undefined}
          />
          <span className="small-tag">
            <Sparkles size={12} />
            Góc của em
          </span>
        </div>
      </section>
      <div className="today-grid">
        <div className="daily-column">
          <section className="card checklist-card">
            <div className="card-topline">
              <div>
                <p className="eyebrow">{isToday ? 'VIỆC HÔM NAY' : 'VIỆC TRONG NGÀY'}</p>
                <h2>
                  {count === habits.length && habits.length
                    ? 'Em đã duy trì đủ các việc!'
                    : 'Bắt đầu từ một việc nhỏ'}
                </h2>
              </div>
              <div className="day-navigation">
                <button
                  className="icon-button"
                  aria-label="Ngày trước"
                  disabled={date <= data.profile!.startedOn}
                  onClick={() => setDate(addDays(date, -1))}
                >
                  <ChevronLeft size={18} />
                </button>
                <input
                  aria-label="Chọn ngày ghi nhận"
                  type="date"
                  value={date}
                  min={data.profile!.startedOn}
                  max={currentDate}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value)
                  }}
                />
                <button
                  className="icon-button"
                  aria-label="Ngày sau"
                  disabled={date >= currentDate}
                  onClick={() => setDate(addDays(date, 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            {!isToday && (
              <button className="text-button back-today" onClick={() => setDate(currentDate)}>
                Về hôm nay
              </button>
            )}
            <div className="daily-progress">
              <div>
                <strong>
                  {count}
                  <span> / {habits.length}</span>
                </strong>
                <p>việc đã duy trì</p>
              </div>
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
          </section>
          <div className="gentle-note">
            <BookOpen size={17} />
            <p>
              <strong>Đọc và viết theo điều em thích.</strong> Chọn sách chữ về bóng đá, những câu
              chuyện hoặc chủ đề khiến em tò mò.
            </p>
          </div>
        </div>
        <aside className="today-sidebar">
          <section className="card weekly-peek">
            <div className="aside-heading">
              <span className="round-icon">
                <Target size={18} />
              </span>
              <h3>Tuần của em</h3>
            </div>
            <p className="aside-number">
              {stats.credited}
              <span> / {stats.planned} lượt</span>
            </p>
            <div className="progress-track">
              <span style={{ width: `${stats.rate ?? 0}%` }} />
            </div>
            <p className="muted">
              {planForDate(data.plans, currentDate)?.phase === 3
                ? `Cùng hướng tới ${stats.target} lượt duy trì tuần này.`
                : 'Ghi nhận từng lần em đã bắt đầu.'}
            </p>
            <div className="mini-week">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(weekStart(currentDate), i),
                  hs = activeHabits(planForDate(data.plans, d))
                const n = hs.filter((h) =>
                  isCredited(data.checkins.find((c) => c.date === d && c.habitId === h.id)?.status),
                ).length
                const rest = data.excuses.some((e) => e.date === d)
                return (
                  <div
                    key={d}
                    className={`${d === currentDate ? 'current' : ''} ${n > 0 ? 'has-progress' : ''}`}
                    title={`${longDate(d)}: ${rest ? 'Nghỉ' : `${n}/${hs.length} việc`}`}
                  >
                    <small>{i === 6 ? 'CN' : `T${i + 2}`}</small>
                    <span>
                      {rest ? (
                        <Coffee size={13} />
                      ) : n === hs.length && n ? (
                        <Check size={15} />
                      ) : n > 0 ? (
                        n
                      ) : (
                        <span className="tiny-dot" />
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
            <button className="text-button" onClick={onProgress}>
              Xem tiến độ <ArrowUpRight size={15} />
            </button>
          </section>
          <section className={`card encouragement-card ${message ? '' : 'quiet'}`}>
            <Asset
              path={data.profile!.familyPhoto}
              repo={repo}
              alt="Ảnh gia đình cổ vũ em"
              className="family-photo"
            />
            <div className="aside-heading">
              <Heart size={17} />
              <h3>{message ? `${message.authorName} nhắn em` : 'Một chút động viên'}</h3>
            </div>
            {message ? (
              <>
                <Asset
                  path={message.imagePath}
                  repo={repo}
                  alt="Ảnh kèm lời động viên"
                  className="message-photo"
                />
                <p className="personal-message">“{message.body}”</p>
                <button className="text-button" onClick={onGoals}>
                  Đọc các lời nhắn <ArrowUpRight size={15} />
                </button>
              </>
            ) : (
              <p className="personal-message">
                Em không cần làm hoàn hảo mọi ngày. Mình cứ quay lại, rồi làm từng việc.
              </p>
            )}
          </section>
          {goal && (
            <section className="card goal-peek">
              <div className="aside-heading">
                <CompassIcon />
                <h3>Điều em hướng tới</h3>
              </div>
              <Asset path={goal.imagePath} repo={repo} alt={goal.title} className="goal-photo" />
              <h4>{goal.title}</h4>
              <p className="muted">
                {goal.milestones.filter((m) => m.achieved).length}/{goal.milestones.length} mốc đã
                cùng xác nhận
              </p>
              <button className="text-button" onClick={onGoals}>
                Nhìn về phía trước <ArrowUpRight size={15} />
              </button>
            </section>
          )}
          {reward && (
            <section className="card reward-peek">
              <Trophy size={21} />
              <h3>{reward.received ? 'Cả nhà đã ghi nhận em' : 'Điều đang chờ em'}</h3>
              <Asset
                path={reward.imagePath}
                repo={repo}
                alt={reward.title}
                className="reward-photo"
              />
              <strong>{reward.title}</strong>
              <p>{reward.conditions}</p>
              <button className="text-button" onClick={onGoals}>
                Xem cùng mục tiêu <ArrowUpRight size={15} />
              </button>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
const CompassIcon = () => <Target size={17} />

export function DailyChecklist({
  data,
  repo,
  run,
  busy,
  date,
  currentDate,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  date: string
  currentDate: string
}) {
  const plan = planForDate(data.plans, date),
    habits = activeHabits(plan),
    excuse = data.excuses.find((e) => e.date === date)
  if (date < data.profile!.startedOn)
    return (
      <Empty
        icon={<CalendarIcon />}
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
  const groups = [
    {
      id: 'morning',
      title: 'Buổi sáng',
      hint: weekday(date) < 6 ? '05:15 – 05:45' : 'Giờ linh hoạt',
      icon: Sun,
    },
    { id: 'review', title: 'Ôn bài', hint: 'Nhớ ghi lại điều đã ôn', icon: BookOpen },
    { id: 'evening', title: 'Đọc và viết', hint: 'Một khoảng yên tĩnh cuối ngày', icon: Moon },
  ] as const
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
      {groups
        .filter((g) => habits.some((h) => h.period === g.id))
        .map((group) => (
          <section
            className={`habit-group ${date === currentDate && currentPeriod() === group.id ? 'current-group' : ''}`}
            key={group.id}
          >
            <div className="group-heading">
              <group.icon size={16} />
              <h3>{group.title}</h3>
              <span>{group.hint}</span>
              {date === currentDate && currentPeriod() === group.id && (
                <span className="now-label">Lúc này</span>
              )}
            </div>
            {habits
              .filter((h) => h.period === group.id)
              .map((habit) => (
                <HabitRow
                  key={`${date}-${habit.id}`}
                  habit={habit}
                  date={date}
                  data={data}
                  repo={repo}
                  run={run}
                  busy={busy}
                  editable={editable}
                />
              ))}
          </section>
        ))}
    </>
  )
}
const CalendarIcon = () => <Clock3 size={26} />
function HabitRow({
  habit,
  date,
  data,
  repo,
  run,
  busy,
  editable,
}: {
  habit: Habit
  date: string
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  editable: boolean
}) {
  const check = data.checkins.find((c) => c.date === date && c.habitId === habit.id),
    status = check?.status ?? 'not_started'
  const [note, setNote] = useState(check?.note ?? ''),
    [dirty, setDirty] = useState(false),
    [baseVersion, setBaseVersion] = useState(check?.version ?? 0),
    [error, setError] = useState('')
  const input = useRef<HTMLTextAreaElement>(null),
    schedule = habit.schedule[String(weekday(date))]
  useEffect(() => {
    if (!dirty) {
      setNote(check?.note ?? '')
      setBaseVersion(check?.version ?? 0)
    }
  }, [check?.note, check?.version, dirty])
  const conflict = dirty && baseVersion !== (check?.version ?? 0)
  const save = async (next: CheckinStatus) => {
    setError('')
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
    if (
      await run(
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
    )
      setDirty(false)
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
            <h4>{habit.title}</h4>
            {status === 'extra' && (
              <span className="extra-star" title="Em đã làm thêm">
                <Sparkles size={14} />
              </span>
            )}
          </div>
          <p>
            {habit.target} {habit.unit}
            {schedule?.subject && (
              <>
                <span className="separator">·</span>
                {schedule.subject}
              </>
            )}
            {schedule?.time && (
              <>
                <span className="separator">·</span>
                <Clock3 size={11} />
                {schedule.time}
              </>
            )}
          </p>
        </div>
        <div className="habit-actions">
          {habit.url && (
            <a className="study-link" href={habit.url} target="_blank" rel="noopener noreferrer">
              Mở học <ArrowUpRight size={14} />
            </a>
          )}
          {editable ? (
            <details className="status-menu">
              <summary
                className={`status-badge ${status}`}
                aria-label={`Chọn mức cho ${habit.title}`}
              >
                {status === 'not_started' ? 'Chọn mức' : STATUS_LABELS[status]}
                <ChevronDown size={13} />
              </summary>
              <div className="status-options">
                {(
                  [
                    'done',
                    ...(hasMinimum(habit) ? ['minimum'] : []),
                    'extra',
                    'not_started',
                  ] as CheckinStatus[]
                ).map((value) => (
                  <button
                    key={value}
                    disabled={busy}
                    onClick={(e) => {
                      e.currentTarget.closest('details')?.removeAttribute('open')
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
            </details>
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
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
