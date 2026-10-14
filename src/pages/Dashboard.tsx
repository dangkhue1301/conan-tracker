import { useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coins,
  Coffee,
  Flame,
  Languages,
  Minus,
  NotebookPen,
  PencilLine,
  Sparkles,
  Sprout,
  Star,
  Zap,
} from 'lucide-react'
import type { HabitId, Repository, Snapshot } from '../types'
import type { Run } from '../App'
import {
  activeHabits,
  addDays,
  canEdit,
  habitTitle,
  isCredited,
  longDate,
  planForDate,
  shortDate,
  snapshotIndex,
  weekDays,
  weeklyStats,
  weekStart,
} from '../domain'
import { defaultHabits, HABIT_IDS, STATUS_LABELS } from '../defaults'
import { gameStats } from '../gamification'
import { StreakFlame } from '../cosmetics'
import { Button, Modal } from '../ui'
import { DailyChecklist } from './Today'
import { StreakCare } from './GameExtras'

const visuals = {
  anki: { icon: Languages, color: '#6366f1', soft: '#eef2ff' },
  grammar: { icon: PencilLine, color: '#10a876', soft: '#e7f8ef' },
  mental: { icon: Brain, color: '#ea8a15', soft: '#fff5df' },
  review: { icon: NotebookPen, color: '#e45589', soft: '#fff0f5' },
  reading: { icon: BookOpen, color: '#3288e5', soft: '#edf5ff' },
  writing: { icon: PencilLine, color: '#9b61df', soft: '#f5edff' },
  tidy: { icon: Sprout, color: '#17a0a0', soft: '#e4f8f5' },
} as const

export default function Dashboard({
  data,
  repo,
  run,
  busy,
  currentDate,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  currentDate: string
}) {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ date: string; habitId?: HabitId } | null>(null)
  const [help, setHelp] = useState(false),
    [repair, setRepair] = useState(false)
  const start = selectedWeek ?? weekStart(currentDate),
    days = weekDays(start)
  const index = useMemo(() => snapshotIndex(data), [data])
  const stats = useMemo(() => gameStats(data, currentDate), [data, currentDate])
  const weekly = weeklyStats(data, start, currentDate, index)
  const habits = HABIT_IDS.map((id) => {
    const plan = planForDate(
      data.plans,
      addDays(start, 6) < currentDate ? addDays(start, 6) : currentDate,
    )
    return plan?.habits.find((h) => h.id === id) ?? defaultHabits().find((h) => h.id === id)!
  })
  const completedToday = activeHabits(planForDate(data.plans, currentDate)).filter((h) =>
    isCredited(index.checkins.get(`${currentDate}:${h.id}`)?.status),
  ).length
  const currentHabits = activeHabits(planForDate(data.plans, currentDate)).length
  const series = days.map((date) => {
    const applicable =
      date >= data.profile!.startedOn && !index.excuses.has(date)
        ? activeHabits(planForDate(data.plans, date))
        : []
    const count = applicable.filter((h) =>
      isCredited(index.checkins.get(`${date}:${h.id}`)?.status),
    ).length
    return {
      date,
      count,
      total: applicable.length,
      rate: applicable.length ? (count / applicable.length) * 100 : 0,
    }
  })
  const chartSeries = series.filter((d) => d.date <= currentDate)
  const chartPoints = chartSeries.map((d, i) => `${40 + i * 80},${155 - d.rate * 1.2}`).join(' ')
  const tick = (date: string, id: HabitId) => {
    const check = index.checkins.get(`${date}:${id}`)
    if (
      id === 'review' ||
      !canEdit(data.actor.role, date, currentDate) ||
      (check && ['minimum', 'extra'].includes(check.status))
    ) {
      setDetail({ date, habitId: id })
      return
    }
    void run(
      () =>
        repo.saveCheckin({
          date,
          habitId: id,
          status: isCredited(check?.status) ? 'not_started' : 'done',
          note: check?.note ?? '',
          expectedVersion: check?.version ?? 0,
        }),
      isCredited(check?.status)
        ? 'Đã bỏ ghi nhận.'
        : 'Thêm một lần giữ lời với mình. +10 Coin · +20 XP',
    )
  }
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">CONANHABIT · TỪNG NGÀY MỘT CHÚT</p>
          <h1>Hôm nay</h1>
          <p className="muted">
            {longDate(currentDate)} · {completedToday}/{currentHabits} việc đã ghi nhận
          </p>
        </div>
        <div className="button-row">
          <button
            className="icon-button"
            aria-label="Cách tính Coin, XP và streak"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={20} />
          </button>
          <Button onClick={() => setDetail({ date: currentDate })}>
            <Check size={17} />
            Ghi chi tiết hôm nay
          </Button>
        </div>
      </div>
      <div className="habit-kpis">
        <div className="habit-kpi kpi-orange">
          <span className="kpi-icon">
            <StreakFlame count={stats.currentStreak} size={30} />
          </span>
          <div>
            <span>Streak hiện tại</span>
            <strong>
              {stats.currentStreak}
              <small> ngày</small>
            </strong>
            <small>Kỷ lục {stats.bestStreak} ngày</small>
          </div>
          <button className="kpi-link" onClick={() => setRepair(true)}>
            Giữ nhịp <ChevronRight size={13} />
          </button>
        </div>
        <div className="habit-kpi kpi-green">
          <span className="kpi-icon">
            <Check size={27} />
          </span>
          <div>
            <span>Duy trì trong tuần</span>
            <strong>
              {weekly.rate ?? 0}
              <small>%</small>
            </strong>
            <small>
              {weekly.credited}/{weekly.planned} lượt theo lịch đang xem
            </small>
          </div>
        </div>
        <div className="habit-kpi kpi-violet">
          <span className="kpi-icon">
            <Coins size={27} />
          </span>
          <div>
            <span>Ví Conan Coin</span>
            <strong>{stats.coins.toLocaleString('vi-VN')}</strong>
            <small>Dùng mua đồ trong Shop</small>
          </div>
        </div>
        <div className="habit-kpi kpi-blue">
          <span className="kpi-icon">
            <Zap size={27} />
          </span>
          <div>
            <span>XP tuần này</span>
            <strong>
              {stats.weeklyXp.toLocaleString('vi-VN')}
              <small> XP</small>
            </strong>
            <small>Tổng tích lũy {stats.xp.toLocaleString('vi-VN')} XP</small>
          </div>
        </div>
      </div>
      <section className="card habit-board">
        <div className="board-toolbar">
          <div>
            <h2>Bảng thói quen</h2>
            <p className="muted">Bảy việc nhỏ, một nhịp sống tốt hơn.</p>
          </div>
          <div className="week-navigation">
            <button
              className="icon-button"
              aria-label="Tuần trước"
              disabled={start <= weekStart(data.profile!.startedOn)}
              onClick={() => setSelectedWeek(addDays(start, -7))}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {shortDate(start)} – {shortDate(addDays(start, 6))}
            </span>
            <button
              className="icon-button"
              aria-label="Tuần sau"
              disabled={start >= weekStart(currentDate)}
              onClick={() => setSelectedWeek(addDays(start, 7))}
            >
              <ChevronRight size={18} />
            </button>
            <button className="button secondary small" onClick={() => setSelectedWeek(null)}>
              Tuần này
            </button>
          </div>
        </div>
        <div className="table-scroll" role="region" aria-label="Bảng thói quen tuần" tabIndex={0}>
          <table className="habit-week-table">
            <colgroup>
              <col className="habit-name-col" />
              {days.map((d) => (
                <col key={d} />
              ))}
              <col className="habit-streak-col" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">THÓI QUEN</th>
                {days.map((date, i) => (
                  <th scope="col" key={date} className={date === currentDate ? 'today-column' : ''}>
                    <span>{i === 6 ? 'CN' : `T${i + 2}`}</span>
                    <small>{shortDate(date)}</small>
                    {date === currentDate && <i />}
                  </th>
                ))}
                <th scope="col">
                  STREAK
                  <br />
                  <small>Hiện tại</small>
                </th>
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => {
                const v = visuals[habit.id],
                  Icon = v.icon
                return (
                  <tr
                    key={habit.id}
                    style={{ '--habit-color': v.color, '--habit-soft': v.soft } as CSSProperties}
                  >
                    <th scope="row">
                      <div className="board-habit-name">
                        <span className="habit-symbol">
                          <Icon size={21} />
                        </span>
                        <div>
                          {habit.url ? (
                            <a href={habit.url} target="_blank" rel="noopener noreferrer">
                              {habitTitle(habit)} <ArrowUpRight size={13} />
                            </a>
                          ) : (
                            <span>{habitTitle(habit)}</span>
                          )}
                          <small>
                            {habit.target} {habit.unit}
                            {habit.id === 'review' ? ' · Có ghi chú' : ''}
                          </small>
                        </div>
                      </div>
                    </th>
                    {days.map((date) => {
                      const applicable =
                        date >= data.profile!.startedOn &&
                        activeHabits(planForDate(data.plans, date)).some((h) => h.id === habit.id)
                      const future = date > currentDate,
                        rest = index.excuses.has(date),
                        check = index.checkins.get(`${date}:${habit.id}`),
                        status = check?.status ?? 'not_started'
                      const label = !applicable
                        ? 'Chưa áp dụng'
                        : rest
                          ? 'Được nghỉ'
                          : future
                            ? 'Chưa đến ngày'
                            : STATUS_LABELS[status]
                      return (
                        <td key={date} className={date === currentDate ? 'today-column' : ''}>
                          <button
                            className={`habit-day ${status} ${!applicable || future ? 'unavailable' : ''} ${rest ? 'rest' : ''}`}
                            role="checkbox"
                            aria-checked={status === 'minimum' ? 'mixed' : isCredited(status)}
                            aria-label={`${habitTitle(habit)}, ${longDate(date)}: ${label}`}
                            title={`${habitTitle(habit)} · ${shortDate(date)} · ${label}${check?.note ? `\n${check.note}` : ''}`}
                            disabled={
                              busy || !applicable || future || rest || data.actor.role === 'parent'
                            }
                            onClick={() => tick(date, habit.id)}
                          >
                            {!applicable ? (
                              <Minus size={14} />
                            ) : rest ? (
                              <Coffee size={16} />
                            ) : future ? (
                              <span className="day-dot" />
                            ) : status === 'done' ? (
                              <Check size={20} strokeWidth={3} />
                            ) : status === 'extra' ? (
                              <Sparkles size={20} />
                            ) : status === 'minimum' ? (
                              <Minus size={20} />
                            ) : (
                              <span className="day-dot" />
                            )}
                          </button>
                        </td>
                      )
                    })}
                    <td>
                      <span
                        className={`habit-streak ${stats.perHabit[habit.id].current ? 'active' : ''}`}
                      >
                        <StreakFlame count={stats.perHabit[habit.id].current} size={23} />
                        <b>{stats.perHabit[habit.id].current}</b>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="board-footer">
          <div className="board-legend">
            <span>
              <i className="legend-done" />
              Làm đủ
            </span>
            <span>
              <i className="legend-minimum" />
              Ít nhất
            </span>
            <span>
              <i className="legend-extra" />
              Làm thêm
            </span>
            <span>
              <Coffee size={13} />
              Được nghỉ
            </span>
          </div>
          <p>Bấm ô để tick · Chọn “Ghi chi tiết” để đổi mức hoặc ghi nội dung ôn bài.</p>
        </div>
      </section>
      <div className="dashboard-charts">
        <section className="card dashboard-chart">
          <div className="card-topline">
            <div>
              <h2>Nhịp học trong tuần</h2>
              <p className="muted">Mỗi lần bắt đầu đều được ghi nhận.</p>
            </div>
            <span className="chart-pill">
              <Star size={14} />
              {weekly.credited} lượt
            </span>
          </div>
          <div className="week-area-chart">
            <svg
              viewBox="0 0 560 190"
              role="img"
              aria-label={`Tiến độ tuần: ${weekly.credited} trên ${weekly.planned} lượt`}
            >
              <defs>
                <linearGradient id="habit-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity=".35" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 50, 100].map((n) => (
                <g key={n}>
                  <line
                    x1="40"
                    x2="520"
                    y1={155 - n * 1.2}
                    y2={155 - n * 1.2}
                    stroke="var(--line)"
                    strokeDasharray="4 5"
                  />
                  <text x="2" y={159 - n * 1.2}>
                    {n}%
                  </text>
                </g>
              ))}
              {chartSeries.length > 0 && (
                <>
                  <polygon
                    points={`40,155 ${chartPoints} ${40 + (chartSeries.length - 1) * 80},155`}
                    fill="url(#habit-chart-fill)"
                  />
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
              {series.map((d, i) => (
                <g key={d.date}>
                  {d.date <= currentDate && (
                    <circle cx={40 + i * 80} cy={155 - d.rate * 1.2} r="4.5" fill="#6366f1">
                      <title>
                        {shortDate(d.date)}: {d.count}/{d.total} việc
                      </title>
                    </circle>
                  )}
                  <text x={40 + i * 80} y="184" textAnchor="middle">
                    {i === 6 ? 'CN' : `T${i + 2}`}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>
        <section className="card dashboard-chart">
          <div className="card-topline">
            <div>
              <h2>Streak từng thói quen</h2>
              <p className="muted">Hiện tại và những kỷ lục của em.</p>
            </div>
            <Flame size={21} className="orange-icon" />
          </div>
          <div className="streak-bars">
            {habits.map((h) => {
              const s = stats.perHabit[h.id],
                max = Math.max(1, ...HABIT_IDS.map((id) => stats.perHabit[id].best))
              return (
                <div className="streak-bar-row" key={h.id}>
                  <span>{habitTitle(h)}</span>
                  <div className="streak-bar-track">
                    <i
                      style={{
                        width: `${(s.best / max) * 100}%`,
                        background: visuals[h.id].color,
                        opacity: 0.18,
                      }}
                    />
                    <b
                      style={{
                        width: `${(s.current / max) * 100}%`,
                        background: visuals[h.id].color,
                      }}
                    />
                  </div>
                  <small>
                    {s.current}
                    <span> / {s.best}</span>
                  </small>
                </div>
              )
            })}
          </div>
          <p className="chart-footnote">
            Ngày nghỉ được duyệt giữ nguyên streak. Làm ít nhất vẫn được tính.
          </p>
        </section>
      </div>
      {detail && (
        <Modal
          title={`${detail.habitId ? habitTitle(habits.find((h) => h.id === detail.habitId)!) : 'Ghi chi tiết'} · ${shortDate(detail.date)}`}
          onClose={() => setDetail(null)}
        >
          <DailyChecklist
            data={data}
            repo={repo}
            run={run}
            busy={busy}
            date={detail.date}
            currentDate={currentDate}
            onlyHabit={detail.habitId}
          />
        </Modal>
      )}
      {help && (
        <Modal title="Mỗi lần cố gắng đều có giá trị" onClose={() => setHelp(false)}>
          <div className="game-help">
            <p>
              <b>Coin</b> là tiền mua đồ trong Shop. <b>XP</b> dùng để leo hạng và luôn độc lập với
              Coin.
            </p>
            <div className="points-table">
              <span>Mức ghi nhận</span>
              <span>Coin</span>
              <span>XP</span>
              <b>Ít nhất</b>
              <b>5</b>
              <b>10</b>
              <b>Làm đủ</b>
              <b>10</b>
              <b>20</b>
              <b>Làm thêm</b>
              <b>15</b>
              <b>30</b>
            </div>
            <p>
              Đủ tất cả việc trong ngày ở mức ít nhất: thêm <b>10 Coin + 20 XP</b>. Sửa hoặc bỏ tick
              sẽ điều chỉnh lại điểm.
            </p>
            <p>
              <b>Streak chung</b> tăng khi em thực hiện tất cả việc áp dụng trong ngày. Mỗi việc
              cũng có streak riêng. Ngày nghỉ được duyệt giữ nguyên streak.
            </p>
            <p>Mốc mới: 7, 10, 30, 60, 100, 180, 365 ngày và mỗi 100 ngày tiếp theo.</p>
          </div>
        </Modal>
      )}
      {repair && (
        <Modal title="Giữ nhịp, rồi bắt đầu lại" onClose={() => setRepair(false)}>
          <StreakCare data={data} repo={repo} run={run} busy={busy} currentDate={currentDate} />
        </Modal>
      )}
    </>
  )
}
