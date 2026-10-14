import { useEffect, useState } from 'react'
import {
  Check,
  ChevronRight,
  Gift,
  Heart,
  Medal,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'
import type { Repository, Snapshot } from '../types'
import type { Run } from '../App'
import type { MonthlyPrize } from '../gamification-types'
import { addDays, shortDate, weekStart } from '../domain'
import {
  gameState,
  gameStats,
  leagueEntries,
  LEAGUES,
  monthlyProgress,
  promotionSlots,
} from '../gamification'
import { Button, Modal } from '../ui'
import { FrameArtwork, ProfileAvatar } from '../cosmetics'
import { itemById } from '../shop-catalog'
import { LeagueBadge, leagueRankStyle } from '../rank-badges'

const regionNames = new Intl.DisplayNames(['vi'], { type: 'region' })
const countryLabel = (code: string) =>
  `${String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + 127397))} ${regionNames.of(code) ?? code}`

interface Props {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  currentDate: string
}
const statusLabels = {
  pending: 'Chờ xác nhận',
  approved: 'Đã đồng ý',
  rejected: 'Cùng thảo luận lại',
  delivered: 'Đã nhận quà',
}

export function StreakCare({ data, repo, run, busy, currentDate }: Props) {
  const [date, setDate] = useState(addDays(currentDate, -1)),
    [reason, setReason] = useState(''),
    [prevention, setPrevention] = useState('')
  const game = gameState(data),
    mentor = data.actor.role === 'mentor'
  return (
    <div className="streak-care">
      <p className="muted">
        Một ngày lỡ nhịp có thể là lúc mình học cách chuẩn bị tốt hơn. Em có thể xin nối lại streak
        cho một ngày trong 7 ngày vừa qua.
      </p>
      <div className="care-note">
        <ShieldCheck size={23} />
        <p>
          Mỗi tháng có tối đa <b>một ngày</b> được sửa. Anh Khuê duyệt sau khi đọc lời tự nhìn lại
          của em. Ngày đó giữ nhịp, không tăng streak hay điểm.
        </p>
      </div>
      {data.actor.role !== 'parent' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (
              await run(
                () => repo.gameAction({ type: 'repair-request', date, reason, prevention }),
                'Đã gửi lời tự nhìn lại đến người hướng dẫn.',
              )
            ) {
              setReason('')
              setPrevention('')
            }
          }}
        >
          <label>
            Ngày em quên
            <input
              type="date"
              min={addDays(currentDate, -7)}
              max={addDays(currentDate, -1)}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Điều gì đã xảy ra?
            <textarea
              required
              minLength={5}
              maxLength={500}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Em quên vì…"
            />
          </label>
          <label>
            Lần tới em sẽ chuẩn bị thế nào?
            <textarea
              required
              minLength={5}
              maxLength={500}
              rows={2}
              value={prevention}
              onChange={(e) => setPrevention(e.target.value)}
              placeholder="Em sẽ đặt sách sẵn trên bàn và…"
            />
          </label>
          <Button type="submit" busy={busy}>
            Gửi lời tự nhìn lại <Heart size={16} />
          </Button>
        </form>
      )}
      {game.repairs.length > 0 && (
        <div className="care-requests">
          <h3>Những lần em đã nhìn lại</h3>
          {[...game.repairs].reverse().map((r) => (
            <article key={r.id}>
              <div className="card-topline">
                <strong>{shortDate(r.date)}</strong>
                <span className={`request-state ${r.status}`}>
                  {r.status === 'pending'
                    ? 'Chờ anh Khuê'
                    : r.status === 'approved'
                      ? 'Đã nối lại streak'
                      : 'Cần trao đổi thêm'}
                </span>
              </div>
              <p>{r.reason}</p>
              <p className="muted">Lần tới: {r.prevention}</p>
              {mentor && r.status === 'pending' && (
                <div className="button-row">
                  <Button
                    className="secondary"
                    busy={busy}
                    onClick={() =>
                      void run(() =>
                        repo.gameAction({ type: 'repair-review', id: r.id, approve: false }),
                      )
                    }
                  >
                    Trao đổi lại
                  </Button>
                  <Button
                    busy={busy}
                    onClick={() =>
                      void run(
                        () => repo.gameAction({ type: 'repair-review', id: r.id, approve: true }),
                        'Đã duyệt nối lại streak.',
                      )
                    }
                  >
                    <Check size={16} />
                    Duyệt nối streak
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function MonthlyRewards({ data, repo, run, busy, currentDate }: Props) {
  const [month, setMonth] = useState(currentDate.slice(0, 7)),
    [wish, setWish] = useState(''),
    [editing, setEditing] = useState<MonthlyPrize | null>(null)
  const game = gameState(data),
    progress = monthlyProgress(data, month, currentDate),
    adult = data.actor.role !== 'learner'
  const request = game.prizeRequests.find((r) => r.month === month && r.status !== 'rejected')
  const submit = (title: string) =>
    void run(
      () => repo.gameAction({ type: 'prize-request', month, title }),
      'Đã gửi điều em mong muốn. Cùng chờ ba mẹ hoặc anh Khuê xác nhận nhé.',
    )
  return (
    <section className="monthly-rewards">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MỘT THÁNG CỐ GẮNG, MỘT KỶ NIỆM VUI</p>
          <h2>Quà tháng</h2>
          <p className="muted">
            Cùng gia đình chọn điều em mong đợi. Quà tháng không tiêu Coin hay XP.
          </p>
        </div>
        <input
          aria-label="Tháng xem quà"
          type="month"
          min={data.profile!.startedOn.slice(0, 7)}
          max={currentDate.slice(0, 7)}
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
        />
      </div>
      <div className="card month-summary">
        <span className="month-gift">
          <Gift size={32} />
        </span>
        <div>
          <h3>
            Hành trình tháng {Number(month.slice(5))}/{month.slice(0, 4)}
          </h3>
          <p>
            {progress.completed}/{progress.total} ngày giữ nhịp
          </p>
          <div className="progress-track">
            <span
              style={{
                width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <small className="muted">
            {progress.reason ||
              (progress.eligible
                ? 'Em đã hoàn thành cả tháng. Cùng chọn một món quà nhé.'
                : 'Tiếp tục từng ngày. Ngày nghỉ được duyệt và một ngày sửa streak được chấp nhận.')}
          </small>
        </div>
        <span className={`request-state ${progress.eligible ? 'approved' : 'pending'}`}>
          {progress.eligible ? 'Đủ điều kiện' : progress.ended ? 'Cùng nhìn lại' : 'Đang tích lũy'}
        </span>
      </div>
      {request && (
        <div className="card reward-request">
          <div>
            <span className="eyebrow">ĐIỀU EM ĐANG MONG</span>
            <h3>{request.title}</h3>
            <span className={`request-state ${request.status}`}>
              {statusLabels[request.status]}
            </span>
          </div>
          {adult && request.status !== 'delivered' && (
            <div className="button-row">
              {request.status === 'pending' && (
                <>
                  <Button
                    className="secondary"
                    busy={busy}
                    onClick={() =>
                      void run(() =>
                        repo.gameAction({
                          type: 'prize-review',
                          id: request.id,
                          status: 'rejected',
                        }),
                      )
                    }
                  >
                    Thảo luận lại
                  </Button>
                  <Button
                    busy={busy}
                    onClick={() =>
                      void run(
                        () =>
                          repo.gameAction({
                            type: 'prize-review',
                            id: request.id,
                            status: 'approved',
                          }),
                        'Đã đồng ý quà tháng.',
                      )
                    }
                  >
                    <Check size={16} />
                    Đồng ý
                  </Button>
                </>
              )}
              {request.status === 'approved' && (
                <Button
                  busy={busy}
                  onClick={() =>
                    void run(
                      () =>
                        repo.gameAction({
                          type: 'prize-review',
                          id: request.id,
                          status: 'delivered',
                        }),
                      'Đã ghi nhận trao quà.',
                    )
                  }
                >
                  <Gift size={16} />
                  Đã trao quà
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="prize-grid">
        {game.prizeCatalog
          .filter((p) => adult || p.active)
          .map((p, i) => (
            <article className="card prize-card" key={p.id}>
              <span className={`prize-art prize-art-${i % 4}`}>
                <Gift size={34} />
              </span>
              <h3>{p.title}</h3>
              <p className="muted">{p.description}</p>
              <span className="small-tag">{p.active ? 'Một tháng giữ nhịp' : 'Đang ẩn'}</span>
              <div className="button-row">
                {adult && (
                  <Button className="secondary" onClick={() => setEditing({ ...p })}>
                    Chỉnh quà
                  </Button>
                )}
                <Button
                  disabled={
                    busy ||
                    !progress.eligible ||
                    !!request ||
                    !p.active ||
                    data.actor.role === 'parent'
                  }
                  onClick={() => submit(p.title)}
                >
                  Em chọn quà này <ChevronRight size={15} />
                </Button>
              </div>
            </article>
          ))}
        {adult && (
          <button
            className="card prize-add"
            onClick={() =>
              setEditing({ id: crypto.randomUUID(), title: '', description: '', active: true })
            }
          >
            <Plus size={28} />
            <strong>Thêm quà cùng Conan</strong>
            <span>Bữa ăn, chuyến đi hoặc điều cả nhà thống nhất</span>
          </button>
        )}
      </div>
      {!game.prizeCatalog.length && !adult && (
        <p className="empty-prizes">
          Ba mẹ và anh Khuê sẽ cùng em thêm những món quà ở đây. Em cũng có thể viết điều mình mong
          muốn bên dưới.
        </p>
      )}
      {data.actor.role !== 'parent' && (
        <form
          className="card custom-wish"
          onSubmit={(e) => {
            e.preventDefault()
            submit(wish)
          }}
        >
          <div>
            <h3>Em có một điều mong muốn khác?</h3>
            <p className="muted">Viết cụ thể để cả nhà cùng thảo luận.</p>
          </div>
          <label className="sr-only" htmlFor="custom-month-wish">
            Điều em mong muốn
          </label>
          <input
            id="custom-month-wish"
            maxLength={150}
            minLength={3}
            required
            placeholder="Ví dụ: cùng ba mẹ đi ăn món em thích…"
            value={wish}
            onChange={(e) => setWish(e.target.value)}
          />
          <Button type="submit" disabled={!progress.eligible || !!request} busy={busy}>
            <Heart size={16} />
            Gửi mong muốn
          </Button>
        </form>
      )}
      <p className="month-footnote">
        Tính theo tháng dương lịch đầy đủ. Ngày áp dụng lịch đầu tiên cần từ đầu tháng; tháng bắt
        đầu giữa chừng vẫn ghi nhận tiến bộ. Quà đủ điều kiện có thể xin nhận vào tháng sau.
      </p>
      {editing && (
        <Modal title="Cùng chọn quà tháng" onClose={() => setEditing(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (
                await run(
                  () => repo.gameAction({ type: 'prize-save', prize: editing }),
                  'Đã lưu món quà.',
                )
              )
                setEditing(null)
            }}
          >
            <label>
              Tên món quà
              <input
                required
                minLength={3}
                maxLength={100}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </label>
            <label>
              Cùng thống nhất điều gì?
              <textarea
                rows={3}
                maxLength={500}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Ví dụ: chọn một buổi tối cuối tuần, cả nhà cùng đi…"
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Hiện cho Conan lựa chọn
            </label>
            <div className="modal-actions">
              <Button className="secondary" onClick={() => setEditing(null)} type="button">
                Để sau
              </Button>
              <Button type="submit" busy={busy}>
                Lưu món quà
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

function BotAvatar({ seed, frameId }: { seed: number | string; frameId: string }) {
  const n =
    typeof seed === 'number'
      ? seed
      : String(seed)
          .split('')
          .reduce((a, c) => a + c.charCodeAt(0), 0)
  const skin = ['#ffd7b5', '#e4aa7c', '#bf825b', '#8e573e'][n % 4],
    shirt = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'][n % 5]
  const frame = itemById(frameId)
  return (
    <span className="bot-avatar" title={frame?.name}>
      <svg viewBox="0 0 64 64" role="img" aria-label="Avatar nhân vật">
        <rect width="64" height="64" rx="32" fill={shirt} opacity=".2" />
        <path d="M9 64Q10 42 32 42T55 64" fill={shirt} />
        <ellipse cx="32" cy="28" rx="17" ry="19" fill={skin} />
        <path
          d={
            n % 2
              ? 'M15 29Q8 4 32 6Q57 4 49 28L43 18L35 21L27 14L19 25Z'
              : 'M15 26Q12 5 34 6Q57 8 49 30L42 17L20 20Z'
          }
          fill={n % 3 === 0 ? '#854d0e' : '#292438'}
        />
        <circle cx="25" cy="29" r="1.8" fill="#292438" />
        <circle cx="39" cy="29" r="1.8" fill="#292438" />
        <path
          d="M27 37Q32 41 37 37"
          fill="none"
          stroke="#965849"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {n % 3 === 0 && (
          <g stroke="#373242" fill="none">
            <rect x="18" y="24" width="12" height="9" rx="3" />
            <rect x="34" y="24" width="12" height="9" rx="3" />
            <path d="M30 27H34" />
          </g>
        )}
      </svg>
      {frame && <FrameArtwork item={frame} />}
    </span>
  )
}

export function League({ data, repo, run, busy, currentDate }: Props) {
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  const game = gameState(data),
    entries = leagueEntries(data, currentDate, clock),
    stats = gameStats(data, currentDate)
  const tier = game.league.tier,
    slots = promotionSlots(tier),
    joined = game.league.joinedWeek === weekStart(currentDate)
  const conan = entries.find((e) => e.isConan)!,
    above = entries.find((e) => e.rank === conan.rank - 1)
  const podium = [entries[1], entries[0], entries[2]]
  return (
    <div className="league-page">
      <div className="league-heading">
        <div className="league-title-with-badge">
          <LeagueBadge tier={tier} size={76} decorative />
          <div>
            <p className="eyebrow">CÙNG CỐ GẮNG THÊM MỘT CHÚT</p>
            <h1>Giải đấu {LEAGUES[tier]}</h1>
            <p className="muted">
              Tuần {shortDate(weekStart(currentDate))} –{' '}
              {shortDate(addDays(weekStart(currentDate), 6))} · giờ Việt Nam
            </p>
          </div>
        </div>
        <span className="small-tag">Giải đấu mô phỏng</span>
      </div>
      <div className="league-path league-ranks" aria-label="Các hạng giải">
        {LEAGUES.map((name, i) => (
          <div
            key={name}
            className={`league-rank ${i === tier ? 'current' : ''} ${i < tier ? 'passed' : ''}`}
            style={leagueRankStyle(i)}
            title={`${name}${i === tier ? ' · Hạng hiện tại' : i < tier ? ' · Đã vượt qua' : ' · Hạng phía trước'}`}
            aria-current={i === tier ? 'step' : undefined}
          >
            <span>
              <LeagueBadge tier={i} decorative />
            </span>
            <small>{name}</small>
          </div>
        ))}
      </div>
      <div className="league-layout">
        <section className="card league-main">
          <div className="league-podium">
            {podium.map((e) => (
              <div key={e.id} className={`podium-place podium-${e.rank}`}>
                <span className="podium-medal">
                  {e.rank === 1 ? <Trophy size={26} /> : <Medal size={22} />}
                </span>
                {e.isConan ? (
                  <ProfileAvatar data={data} repo={repo} size="large" />
                ) : (
                  <BotAvatar seed={e.avatarSeed} frameId={e.frameId} />
                )}
                <strong>{e.name}</strong>
                <span>{e.xp.toLocaleString('vi-VN')} XP</span>
                <div className="podium-step">{e.rank}</div>
              </div>
            ))}
          </div>
          <div className="league-rows">
            {entries.map((e) => (
              <div
                key={e.id}
                className={`league-row ${e.isConan ? 'is-conan' : ''} ${e.rank <= slots && tier < 9 ? 'promotion' : ''} ${e.rank > 25 && tier > 0 ? 'demotion' : ''}`}
              >
                <strong className="league-position">
                  {e.rank <= 3 ? <Medal size={22} /> : e.rank}
                </strong>
                {e.isConan ? (
                  <ProfileAvatar data={data} repo={repo} size="small" />
                ) : (
                  <BotAvatar seed={e.avatarSeed} frameId={e.frameId} />
                )}
                <div className="league-player">
                  <strong>
                    {e.name}
                    {e.isConan && <span>Em</span>}
                  </strong>
                  <small>{countryLabel(e.country)}</small>
                </div>
                <span className="league-xp">
                  {e.xp.toLocaleString('vi-VN')} <small>XP</small>
                </span>
                {e.rank === slots && tier < 9 && (
                  <span className="league-band-label">VÙNG THĂNG HẠNG</span>
                )}
                {e.rank === 25 && tier > 0 && (
                  <span className="league-band-label demotion-label">VÙNG XUỐNG HẠNG</span>
                )}
              </div>
            ))}
          </div>
        </section>
        <aside className="league-sidebar">
          <section className="card league-personal">
            <span className="round-icon">
              <Zap size={23} />
            </span>
            <h2>Hành trình của em</h2>
            <strong className="my-rank">#{conan.rank}</strong>
            <p>{stats.weeklyXp.toLocaleString('vi-VN')} XP tuần này</p>
            <p className="muted">
              {above
                ? `Thêm ${Math.max(1, above.xp - conan.xp + 1)} XP để vượt vị trí phía trên.`
                : 'Em đang dẫn đầu. Giữ nhịp học của mình nhé!'}
            </p>
            {!joined ? (
              <Button
                busy={busy}
                disabled={data.actor.role === 'parent'}
                onClick={() =>
                  void run(
                    () => repo.gameAction({ type: 'league-join' }),
                    'Đã tham gia giải tuần này.',
                  )
                }
              >
                <Sparkles size={16} />
                Tham gia tuần này
              </Button>
            ) : (
              <span className="request-state approved">
                <Check size={14} />
                Đã tham gia
              </span>
            )}
          </section>
          <section className="card league-rules">
            <h3>
              <Trophy size={18} /> Mục tiêu của tuần
            </h3>
            <p>
              {tier < 9
                ? `Top ${slots} thăng hạng. Duy trì đều các việc mỗi ngày để tiến lên.`
                : 'Hạng cao nhất! Cùng chinh phục vị trí trên bục vinh danh.'}
            </p>
            <p className="muted">Làm thêm giúp tăng XP. Mua đồ bằng Coin giữ nguyên XP của em.</p>
            <p className="muted">
              Giải chốt sau Chủ nhật. Tuần chưa tham gia sẽ không bị xuống hạng.
            </p>
            {tier > 0 && <p className="muted">Năm vị trí cuối xuống một hạng.</p>}
          </section>
          {game.league.history.length > 0 && (
            <section className="card league-history">
              <h3>Những tuần đã qua</h3>
              {[...game.league.history]
                .reverse()
                .slice(0, 5)
                .map((h) => (
                  <div key={h.week}>
                    <span className="league-history-name">
                      <LeagueBadge tier={h.tier} size={30} decorative />
                      {shortDate(h.week)} · {LEAGUES[h.tier]}
                    </span>
                    <strong>
                      #{h.rank} · {h.xp} XP
                    </strong>
                    <small>
                      {h.result === 'promoted'
                        ? 'Đã thăng hạng'
                        : h.result === 'demoted'
                          ? 'Cùng lấy lại nhịp'
                          : 'Giữ hạng'}
                    </small>
                  </div>
                ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
