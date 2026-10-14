import { useMemo, useState, type CSSProperties } from 'react'
import {
  Award,
  Camera,
  Check,
  ChevronRight,
  Coins,
  Flame,
  Frame,
  Image,
  Info,
  LockKeyhole,
  Package,
  PartyPopper,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { Run } from '../App'
import type { CosmeticCategory, ShopItem } from '../gamification-types'
import { gameState, gameStats } from '../gamification'
import { CATEGORY_LABELS, itemById, SHOP_ITEMS } from '../shop-catalog'
import type { Repository, Snapshot } from '../types'
import {
  AvatarStudio,
  CosmeticArt,
  CosmeticDialog,
  MilestoneCelebration,
  ProfileAvatar,
  StreakFlame,
  celebrationStyle,
} from '../cosmetics'
import { Button } from '../ui'

const CATEGORY_ICONS = {
  frame: Frame,
  banner: Image,
  title: Award,
  celebration: PartyPopper,
  pet: PawPrint,
}
const CATEGORY_COLORS: Record<string, string> = {
  flame: '#fb923c',
  football: '#34d399',
  detective: '#60a5fa',
  manga: '#f472b6',
  builder: '#fbbf24',
  space: '#a78bfa',
  fire: '#fb923c',
  water: '#38bdf8',
  lightning: '#facc15',
  ice: '#67e8f9',
  moon: '#c4b5fd',
  dragon: '#f87171',
}
type ShopCategory = Exclude<CosmeticCategory, 'weapon'>
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ShopCategory[]
const number = (n: number) => n.toLocaleString('vi-VN')

export default function Shop({
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
  const [category, setCategory] = useState<ShopCategory>('frame'),
    [ownedOnly, setOwnedOnly] = useState(false),
    [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ShopItem | null>(null),
    [studio, setStudio] = useState(false),
    [celebrationPreview, setCelebrationPreview] = useState(false)
  const [confirmation, setConfirmation] = useState(false),
    [error, setError] = useState('')
  const game = gameState(data),
    stats = gameStats(data, currentDate),
    canEdit = data.actor.role !== 'parent'
  const items = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (item) =>
          item.category === category &&
          (!ownedOnly || game.inventory.includes(item.id)) &&
          `${item.name} ${item.description}`
            .toLocaleLowerCase('vi-VN')
            .includes(query.toLocaleLowerCase('vi-VN').trim()),
      ),
    [category, ownedOnly, query, game.inventory],
  )
  const owned = selected ? game.inventory.includes(selected.id) : false
  const equipped = selected ? game.equipped[selected.category] === selected.id : false
  const qualified = selected
    ? stats.coins >= selected.price &&
      stats.bestStreak >= selected.streakRequired &&
      stats.extraCount >= selected.extraRequired
    : false
  const equipment = CATEGORIES.map((key) => itemById(game.equipped[key])?.name).filter(Boolean)
  const dismiss = () => {
    setSelected(null)
    setConfirmation(false)
    setError('')
    setCelebrationPreview(false)
  }
  return (
    <>
      <div className="shop-header">
        <div>
          <p className="eyebrow">BỘ SƯU TẬP CỦA EM</p>
          <h1>Một chút cá tính. Rất nhiều cố gắng.</h1>
          <p className="cosmetic-muted">
            Dùng Conan Coin để chọn phong cách em thích. Mỗi món là một dấu ấn trên hành trình.
          </p>
        </div>
        <div className="shop-wallet">
          <Coins size={26} />
          <div>
            <strong>{number(stats.coins)}</strong>
            <small>Conan Coin có thể dùng</small>
          </div>
        </div>
      </div>
      <section className="shop-profile-card" aria-label="Hồ sơ và trang bị hiện tại">
        <ProfileAvatar data={data} repo={repo} size="large" />
        <div className="shop-profile-details">
          <h2>{data.profile?.name ?? 'Conan'}</h2>
          <p className="cosmetic-muted">Bền bỉ từng ngày, tỏa sáng theo cách của em.</p>
          <div className="shop-profile-stats">
            <span>
              <StreakFlame count={stats.currentStreak} size={22} />
              <strong>{number(stats.currentStreak)}</strong> ngày hiện tại
            </span>
            <span>
              <Flame size={17} />
              <strong>{number(stats.bestStreak)}</strong> ngày kỷ lục
            </span>
            <span>
              <Zap size={17} />
              <strong>{number(stats.xp)}</strong> XP tích lũy
            </span>
            <span>
              <Package size={17} />
              <strong>{game.inventory.filter((id) => itemById(id)).length}</strong> món đã sở hữu
            </span>
          </div>
          <p className="shop-profile-equipment">
            {equipment.length
              ? `Đang dùng: ${equipment.join(' · ')}`
              : 'Mở bộ sưu tập bên dưới để chọn trang bị đầu tiên.'}
          </p>
        </div>
        <div className="shop-profile-edit">
          <Button className="secondary" onClick={() => setStudio(true)}>
            <Camera size={16} />
            {canEdit ? 'Đổi avatar' : 'Xem avatar'}
          </Button>
          <small>Ảnh của em, cùng khung và linh thú em chọn.</small>
        </div>
      </section>
      <div className="shop-controls">
        <div className="shop-tabs" role="group" aria-label="Loại vật phẩm">
          {CATEGORIES.map((key) => {
            const Icon = CATEGORY_ICONS[key]
            return (
              <button
                key={key}
                className="shop-tab"
                aria-pressed={category === key}
                onClick={() => setCategory(key)}
              >
                <Icon size={17} />
                {CATEGORY_LABELS[key]}
              </button>
            )
          })}
        </div>
        <label className="shop-owned-toggle">
          <input
            type="checkbox"
            checked={ownedOnly}
            onChange={(event) => setOwnedOnly(event.target.checked)}
          />
          Bộ sưu tập đã có
        </label>
      </div>
      <div className="shop-search-row">
        <label className="shop-search">
          <Search size={18} />
          <input
            aria-label="Tìm vật phẩm"
            type="search"
            placeholder="Tìm phong cách em thích…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span>{items.length} vật phẩm · Chọn để xem thử</span>
      </div>
      {items.length ? (
        <div className="shop-items-grid">
          {items.map((item) => {
            const has = game.inventory.includes(item.id),
              wearing = game.equipped[item.category] === item.id
            const metStreak = stats.bestStreak >= item.streakRequired,
              metExtra = stats.extraCount >= item.extraRequired
            return (
              <button
                key={item.id}
                className={`shop-item-card ${wearing ? 'is-equipped' : ''}`}
                onClick={() => {
                  setSelected(item)
                  setConfirmation(false)
                  setError('')
                }}
                aria-label={`${item.name}, ${has ? (wearing ? 'đang dùng' : 'đã sở hữu') : `${number(item.price)} Conan Coin`}`}
              >
                <div
                  className="shop-item-art"
                  style={
                    {
                      '--item-color':
                        item.category === 'celebration'
                          ? celebrationStyle(item.theme).colors[0]
                          : (CATEGORY_COLORS[item.theme] ?? '#a78bfa'),
                    } as CSSProperties
                  }
                >
                  <span className={`shop-item-badge ${wearing ? 'equipped' : ''}`}>
                    {wearing
                      ? 'ĐANG DÙNG'
                      : has
                        ? 'ĐÃ SỞ HỮU'
                        : item.id === 'frame-mist-swordsman'
                          ? 'PREMIUM'
                          : item.tier >= 3
                            ? 'HUYỀN THOẠI'
                            : item.tier >= 2
                              ? 'ĐẶC BIỆT'
                              : 'BỘ SƯU TẬP'}
                  </span>
                  {['frame', 'banner', 'title'].includes(item.category) ? (
                    <ProfileAvatar
                      data={data}
                      repo={repo}
                      preview={{ [item.category]: item.id }}
                      animated={false}
                    />
                  ) : (
                    <div className="cosmetic-static shop-card-standalone-art">
                      <CosmeticArt item={item} />
                    </div>
                  )}
                </div>
                <div className="shop-item-content">
                  <strong>{item.name}</strong>
                  <p className="shop-item-description">{item.description}</p>
                  <div className="shop-item-gates">
                    {!has && item.streakRequired > 0 && (
                      <span className={metStreak ? 'qualified' : ''}>
                        {metStreak ? <Check size={11} /> : <LockKeyhole size={11} />}Streak{' '}
                        {item.streakRequired} ngày
                      </span>
                    )}
                    {!has && item.extraRequired > 0 && (
                      <span className={metExtra ? 'qualified' : ''}>
                        <Sparkles size={11} />
                        {item.extraRequired} lượt làm thêm
                      </span>
                    )}
                    {has && (
                      <span className="qualified">
                        <ShieldCheck size={11} />
                        Sở hữu vĩnh viễn
                      </span>
                    )}
                    {!has && !item.streakRequired && !item.extraRequired && (
                      <span>Chỉ cần Conan Coin</span>
                    )}
                  </div>
                  <div className="shop-item-footer">
                    <span className="shop-item-price">
                      {has ? (
                        <>
                          <Check size={14} />
                          Đã có
                        </>
                      ) : (
                        <>
                          <Coins size={14} />
                          {number(item.price)} Coin
                        </>
                      )}
                    </span>
                    <span className="shop-item-view">
                      Xem thử <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="shop-empty">
          <Package size={36} />
          <strong>
            {ownedOnly ? 'Bộ sưu tập này đang chờ em' : 'Chưa tìm thấy vật phẩm phù hợp'}
          </strong>
          <p>
            {ownedOnly
              ? 'Tắt bộ lọc để khám phá những món em có thể mở.'
              : 'Thử một tên khác hoặc chọn nhóm vật phẩm khác nhé.'}
          </p>
          <Button
            className="secondary"
            onClick={() => {
              setOwnedOnly(false)
              setQuery('')
            }}
          >
            Xem bộ sưu tập
          </Button>
        </div>
      )}
      <p className="shop-rule-note">
        <Info size={16} />
        <span>
          Coin dùng để mua đồ. XP dùng để leo hạng và được giữ nguyên khi mua. Vật phẩm đã sở hữu
          luôn ở lại; điều kiện streak được xét theo kỷ lục tốt nhất của em.
        </span>
      </p>
      {studio && (
        <AvatarStudio
          data={data}
          repo={repo}
          run={run}
          busy={busy}
          onClose={() => setStudio(false)}
        />
      )}
      {selected && !celebrationPreview && (
        <CosmeticDialog
          title={confirmation ? 'Xác nhận lựa chọn của em' : 'Xem thử trên hồ sơ'}
          onClose={dismiss}
          className="shop-preview-dialog"
        >
          <div className="shop-preview-stage">
            {selected.category === 'celebration' ? (
              <div className="shop-preview-celebration">
                <CosmeticArt item={selected} />
                <Button className="secondary" onClick={() => setCelebrationPreview(true)}>
                  <PartyPopper size={16} />
                  Xem hiệu ứng toàn màn hình
                </Button>
              </div>
            ) : (
              <ProfileAvatar
                data={data}
                repo={repo}
                size="hero"
                preview={{ [selected.category]: selected.id }}
              />
            )}
          </div>
          <div className="shop-preview-copy">
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
            </div>
            <span className="shop-preview-price">
              <Coins size={20} />
              {number(selected.price)}
            </span>
          </div>
          {owned ? (
            <p className="shop-equipment-note">
              <ShieldCheck size={17} />
              Món này thuộc về em vĩnh viễn. Em có thể thay trang bị bất cứ lúc nào.
            </p>
          ) : (
            <div className="shop-requirements">
              <Requirement
                passed={stats.coins >= selected.price}
                label="Conan Coin có thể dùng"
                progress={`${number(stats.coins)} / ${number(selected.price)}`}
              />
              {selected.streakRequired > 0 && (
                <Requirement
                  passed={stats.bestStreak >= selected.streakRequired}
                  label="Kỷ lục streak toàn bộ thói quen"
                  progress={`${stats.bestStreak} / ${selected.streakRequired} ngày`}
                />
              )}{' '}
              {selected.extraRequired > 0 && (
                <Requirement
                  passed={stats.extraCount >= selected.extraRequired}
                  label="Số lượt làm thêm đã ghi nhận"
                  progress={`${stats.extraCount} / ${selected.extraRequired}`}
                />
              )}
            </div>
          )}
          {confirmation && (
            <div className="shop-confirmation">
              <strong>Mua “{selected.name}”?</strong>
              <p>
                Số dư sau khi mua:{' '}
                <b>{number(Math.max(0, stats.coins - selected.price))} Conan Coin</b>. Em vẫn giữ
                nguyên {number(stats.xp)} XP. Món đồ được thêm vào bộ sưu tập để em chọn dùng.
              </p>
            </div>
          )}
          {!canEdit && (
            <p className="cosmetic-readonly">
              Conan và người hướng dẫn có thể mua hoặc thay trang bị.
            </p>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="cosmetic-dialog-actions">
            <Button
              className="secondary"
              disabled={busy}
              onClick={() => (confirmation ? setConfirmation(false) : dismiss())}
            >
              {confirmation ? 'Quay lại' : 'Đóng'}
            </Button>
            {canEdit &&
              (owned ? (
                <Button
                  busy={busy}
                  onClick={async () => {
                    setError('')
                    if (
                      await run(
                        () =>
                          repo.gameAction({
                            type: 'equip',
                            category: selected.category,
                            itemId: equipped ? null : selected.id,
                          }),
                        equipped ? 'Đã cất trang bị vào bộ sưu tập.' : 'Đã đổi phong cách của em.',
                      )
                    )
                      dismiss()
                    else setError('Chưa đổi được trang bị. Em thử lại nhé.')
                  }}
                >
                  {equipped ? <Package size={16} /> : <Check size={16} />}
                  {equipped ? 'Cất trang bị' : 'Dùng ngay'}
                </Button>
              ) : (
                <Button
                  busy={busy}
                  disabled={!qualified}
                  onClick={async () => {
                    if (!confirmation) {
                      setConfirmation(true)
                      return
                    }
                    setError('')
                    if (
                      await run(
                        () => repo.gameAction({ type: 'buy', itemId: selected.id }),
                        'Đã thêm vật phẩm vào bộ sưu tập của em.',
                      )
                    )
                      setConfirmation(false)
                    else
                      setError(
                        'Chưa xác nhận mua. Số dư và điều kiện sẽ được kiểm tra lại khi em thử tiếp.',
                      )
                  }}
                >
                  {qualified ? <Coins size={16} /> : <LockKeyhole size={16} />}{' '}
                  {qualified
                    ? confirmation
                      ? 'Xác nhận mua'
                      : 'Mua bằng Coin'
                    : 'Cần thêm cố gắng'}
                </Button>
              ))}
          </div>
        </CosmeticDialog>
      )}
      {selected && celebrationPreview && (
        <MilestoneCelebration
          milestones={[{ key: 'preview', label: 'Xem thử hiệu ứng', count: 30 }]}
          styleId={selected.id}
          onClose={() => setCelebrationPreview(false)}
        />
      )}
    </>
  )
}

function Requirement({
  passed,
  label,
  progress,
}: {
  passed: boolean
  label: string
  progress: string
}) {
  return (
    <div className={`shop-requirement ${passed ? 'passed' : ''}`}>
      {passed ? <Check size={16} /> : <LockKeyhole size={16} />}
      <span>{label}</span>
      <strong>{progress}</strong>
    </div>
  )
}
