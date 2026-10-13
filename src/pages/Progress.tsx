import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  Minus,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { Repository, Snapshot, WeeklyReview } from '../types'
import type { Run } from '../App'
import {
  activeHabits,
  addDays,
  longDate,
  planForDate,
  habitTitle,
  snapshotIndex,
  shortDate,
  weekDays,
  weeklyStats,
  weekStart,
} from '../domain'
import { AUTONOMY_LABELS, HABIT_IDS, STATUS_LABELS, defaultHabits } from '../defaults'
import { Button, Empty, Modal, SectionHeading } from '../ui'
import { DailyChecklist } from './Today'
import { MessageComposer } from './Goals'

export default function Progress({
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
  const [start, setStart] = useState(weekStart(currentDate)),
    [range, setRange] = useState(8),
    [selectedDay, setSelectedDay] = useState<string | null>(null)
  const index = useMemo(() => snapshotIndex(data), [data])
  const stats = weeklyStats(data, start, currentDate, index),
    days = weekDays(start),
    firstWeek = weekStart(data.profile!.startedOn)
  const dayHabits = new Map(
    days.map((date) => [
      date,
      new Set(activeHabits(planForDate(data.plans, date)).map((h) => h.id)),
    ]),
  )
  const habits = HABIT_IDS.map((id) => ({
    ...([...data.plans]
      .reverse()
      .flatMap((p) => p.habits)
      .find((h) => h.id === id) ?? defaultHabits().find((h) => h.id === id)!),
  })).map((h) => ({ ...h, title: habitTitle(h) }))
  const review = data.reviews.find((r) => r.weekStart === start)
  const stageThree = days.some(
    (d) => d >= data.profile!.startedOn && planForDate(data.plans, d)?.phase === 3,
  )
  const series = Array.from({ length: range }, (_, i) => {
    const d = addDays(weekStart(currentDate), -7 * (range - i - 1))
    return { start: d, stats: weeklyStats(data, d, currentDate, index) }
  })
  const recentMisses = HABIT_IDS.map((id) => ({
    id,
    title: habits.find((h) => h.id === id)?.title ?? id,
    missed: series.reduce((sum, w) => sum + (w.stats.perHabit[id]?.missed ?? 0), 0),
  }))
    .filter((h) => h.missed)
    .sort((a, b) => b.missed - a.missed)
  return (
    <>
      <SectionHeading eyebrow="CÙNG NHÌN LẠI" title="Tiến độ của em">
        <div className="week-navigation">
          <button
            className="icon-button"
            aria-label="Tuần trước"
            disabled={start <= firstWeek}
            onClick={() => setStart(addDays(start, -7))}
          >
            <ChevronLeft size={19} />
          </button>
          <span>
            {shortDate(start)} – {shortDate(addDays(start, 6))}
          </span>
          <button
            className="icon-button"
            aria-label="Tuần sau"
            disabled={start >= weekStart(currentDate)}
            onClick={() => setStart(addDays(start, 7))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </SectionHeading>
      <section className="card weekly-table-card">
        <div className="card-topline">
          <div>
            <h2>Bảng theo dõi tuần</h2>
            <p className="muted">
              {stats.ended
                ? stageThree
                  ? stats.rate === null
                    ? 'Tuần này không có lượt cần thực hiện.'
                    : stats.rate >= 80
                      ? 'Em đã đạt mục tiêu duy trì của tuần này.'
                      : 'Cùng xem việc nào cần được hỗ trợ vào tuần tới.'
                  : 'Ghi nhận những việc em đã thực hiện.'
                : 'Tuần đang diễn ra. Các ngày chưa đến vẫn đang chờ em.'}
            </p>
          </div>
          {stageThree && (
            <span className="small-tag">
              <TrendingUp size={14} />
              Mục tiêu 80%
            </span>
          )}
        </div>
        {habits.length ? (
          <>
            <p className="table-scroll-hint">Vuốt ngang để xem đủ các ngày.</p>
            <div className="table-scroll" role="region" aria-label="Bảng tiến độ tuần" tabIndex={0}>
              <table className="weekly-table">
                <thead>
                  <tr>
                    <th>Thói quen</th>
                    {days.map((date, i) => (
                      <th key={date} className={date === currentDate ? 'is-today' : ''}>
                        <span>{i === 6 ? 'CN' : `T${i + 2}`}</span>
                        <small>{shortDate(date)}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => (
                    <tr key={habit.id}>
                      <th scope="row">{habit.title}</th>
                      {days.map((date) => {
                        const enabled =
                            date >= data.profile!.startedOn && dayHabits.get(date)?.has(habit.id),
                          rest = index.excuses.has(date),
                          check = index.checkins.get(`${date}:${habit.id}`),
                          status = check?.status ?? 'not_started',
                          future = date > currentDate
                        const label = !enabled
                          ? 'Chưa áp dụng'
                          : rest
                            ? 'Được nghỉ'
                            : future
                              ? 'Chưa đến ngày'
                              : STATUS_LABELS[status]
                        return (
                          <td key={date} className={date === currentDate ? 'is-today' : ''}>
                            <button
                              className={`day-cell ${!enabled ? 'inactive' : rest ? 'rest' : future ? 'future' : status}`}
                              aria-label={`${habit.title}, ${longDate(date)}: ${label}`}
                              title={label}
                              onClick={() => setSelectedDay(date)}
                              disabled={!enabled}
                            >
                              {!enabled ? (
                                <Minus size={12} />
                              ) : rest ? (
                                <Coffee size={15} />
                              ) : future ? (
                                <span className="tiny-dot" />
                              ) : status === 'done' ? (
                                <Check size={18} />
                              ) : status === 'extra' ? (
                                <Sparkles size={17} />
                              ) : status === 'minimum' ? (
                                <Minus size={17} />
                              ) : (
                                <span className="tiny-dot" />
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-legend">
              <span>
                <i className="done" />
                Làm đủ
              </span>
              <span>
                <i className="minimum" />
                Ít nhất
              </span>
              <span>
                <i className="extra" />
                Làm thêm
              </span>
              <span>
                <i className="not_started" />
                Chưa ghi nhận
              </span>
              <span>
                <Coffee size={12} />
                Nghỉ
              </span>
              <small>Bấm một ô để xem ngày đó</small>
            </div>
          </>
        ) : (
          <Empty
            icon={<CalendarDays size={27} />}
            title="Chưa có lịch trong tuần này"
            text="Chọn một tuần từ ngày bắt đầu theo dõi."
          />
        )}
      </section>
      <div className="stats-grid">
        <div className="card stat">
          <span>Duy trì</span>
          <strong>{stats.rate === null ? '—' : `${stats.rate}%`}</strong>
          <small>
            {stats.credited}/{stats.planned} lượt theo kế hoạch
          </small>
        </div>
        <div className="card stat">
          <span>Đã làm ít nhất</span>
          <strong>
            {stats.minimum}
            <small> lượt</small>
          </strong>
          <small>Mỗi lần bắt đầu đều được ghi nhận</small>
        </div>
        <div className="card stat">
          <span>Làm đủ</span>
          <strong>
            {stats.done}
            <small> lượt</small>
          </strong>
          <small>Đạt yêu cầu của từng việc</small>
        </div>
        <div className="card stat">
          <span>Làm thêm</span>
          <strong>
            {stats.extra}
            <small> lượt</small>
          </strong>
          <small>Những lần em vượt mục tiêu</small>
        </div>
      </div>
      <div className="progress-bottom-grid">
        <section className="card trend-card">
          <div className="card-topline">
            <div>
              <h2>Em đang đi từng bước</h2>
              <p className="muted">Tỷ lệ duy trì theo kế hoạch của từng tuần.</p>
            </div>
            <select
              aria-label="Khoảng xu hướng"
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
            >
              <option value={4}>4 tuần</option>
              <option value={8}>8 tuần</option>
              <option value={12}>12 tuần</option>
            </select>
          </div>
          <div className="trend-chart">
            <div className="chart-labels">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="chart-columns">
              {series.map((w) => (
                <button
                  key={w.start}
                  className={`chart-column ${w.start === start ? 'selected' : ''}`}
                  onClick={() => setStart(w.start)}
                  aria-label={`Tuần ${shortDate(w.start)}: ${w.stats.rate === null ? 'chưa có kế hoạch' : `${w.stats.rate}% duy trì`}`}
                  title={`${shortDate(w.start)}: ${w.stats.credited}/${w.stats.planned} lượt`}
                >
                  <div className="bar-space">
                    <span
                      className={`chart-bar ${w.stats.planned ? '' : 'no-plan'}`}
                      style={{ height: `${w.stats.rate ?? 0}%` }}
                    >
                      <i className="bar-extra" style={{ flex: w.stats.extra }} />
                      <i className="bar-done" style={{ flex: w.stats.done }} />
                      <i className="bar-minimum" style={{ flex: w.stats.minimum }} />
                    </span>
                  </div>
                  <small>{shortDate(w.start)}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="trend-caption">
            <span>Tuần hiện tại đang tiếp tục được ghi nhận.</span>
          </div>
        </section>
        <section className="card support-card">
          <div className="aside-heading">
            <Heart size={18} />
            <h3>Việc cần thêm một chút hỗ trợ</h3>
          </div>
          {recentMisses.length ? (
            <>
              <p className="muted">Trong {range} tuần gần đây, cùng tìm cách dễ bắt đầu hơn.</p>
              <ul>
                {recentMisses.slice(0, 3).map((h) => (
                  <li key={h.id}>
                    <span>{h.title}</span>
                    <strong>
                      {h.missed}
                      <small> lượt chưa ghi nhận</small>
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="soft-note">
                Ghi nhận điều em làm tốt trước, rồi cùng chọn một thay đổi nhỏ.
              </p>
            </>
          ) : (
            <p className="muted">
              Chưa có lượt bị bỏ lại ở những ngày đã qua. Mình tiếp tục quan sát cùng nhau nhé.
            </p>
          )}
        </section>
      </div>
      <section className="card weekly-review-card">
        <div className="aside-heading">
          <BookIcon />
          <h2>Tổng kết cùng người hướng dẫn</h2>
        </div>
        {data.actor.role === 'mentor' ? (
          <ReviewForm
            key={start}
            start={start}
            existing={review}
            repo={repo}
            run={run}
            busy={busy}
          />
        ) : review ? (
          <div className="review-read">
            <div>
              <span className="field-label">Điều em làm tốt</span>
              <p>{review.praise}</p>
            </div>
            {review.adjustment && (
              <div>
                <span className="field-label">Một điều cùng chỉnh</span>
                <p>{review.adjustment}</p>
              </div>
            )}
            <span className="small-tag">{AUTONOMY_LABELS[review.autonomy]}</span>
          </div>
        ) : (
          <p className="muted">
            Cuối tuần, em và người hướng dẫn cùng nhìn lại những việc đã làm được.
          </p>
        )}
      </section>
      {data.actor.role !== 'learner' && (
        <section className="card">
          <SectionHeading title="Gửi em một lời động viên" />
          <MessageComposer repo={repo} run={run} busy={busy} />
        </section>
      )}
      {selectedDay && (
        <Modal title={longDate(selectedDay)} onClose={() => setSelectedDay(null)}>
          <DailyChecklist
            data={data}
            repo={repo}
            run={run}
            busy={busy}
            date={selectedDay}
            currentDate={currentDate}
          />
        </Modal>
      )}
    </>
  )
}
const BookIcon = () => <CalendarDays size={20} />
function ReviewForm({
  start,
  existing,
  repo,
  run,
  busy,
}: {
  start: string
  existing?: WeeklyReview
  repo: Repository
  run: Run
  busy: boolean
}) {
  const [review, setReview] = useState<WeeklyReview>(
    existing ?? { weekStart: start, praise: '', adjustment: '', autonomy: 'same' },
  )
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => repo.saveReview(review), 'Đã lưu tổng kết tuần.')
      }}
    >
      <div className="form-grid two">
        <label>
          Điều em làm tốt
          <textarea
            value={review.praise}
            onChange={(e) => setReview({ ...review, praise: e.target.value })}
            placeholder="Ghi nhận một điều cụ thể em đã cố gắng."
            required
            maxLength={1000}
            rows={3}
          />
        </label>
        <label>
          Một điều cùng chỉnh tuần tới
          <textarea
            value={review.adjustment}
            onChange={(e) => setReview({ ...review, adjustment: e.target.value })}
            placeholder="Chọn một thay đổi nhỏ để em dễ thực hiện hơn."
            maxLength={1000}
            rows={3}
          />
        </label>
      </div>
      <div className="review-form-bottom">
        <label>
          Mức tự giác
          <select
            value={review.autonomy}
            onChange={(e) =>
              setReview({ ...review, autonomy: e.target.value as WeeklyReview['autonomy'] })
            }
          >
            {Object.entries(AUTONOMY_LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" busy={busy}>
          Lưu tổng kết <Check size={16} />
        </Button>
      </div>
    </form>
  )
}
