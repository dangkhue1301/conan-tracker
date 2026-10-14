import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Camera, Check, ImagePlus, Shield, Sparkles, Trash2, X } from 'lucide-react'
import type { Run } from './App'
import type { CosmeticCategory, ShopItem } from './gamification-types'
import { gameState } from './gamification'
import { itemById } from './shop-catalog'
import { CelebrationSymbol, celebrationStyle } from './celebration-symbols'
import type { Repository, Snapshot } from './types'
import { Button, lockBodyScroll } from './ui'
import './cosmetics.css'

export { CelebrationSymbol, CELEBRATION_STYLES, celebrationStyle } from './celebration-symbols'

export function CosmeticName({ item }: { item: ShopItem }) {
  const colors = item.namePalette
  return (
    <span
      className={item.premium ? 'cosmetic-premium-name' : undefined}
      style={
        colors
          ? ({
              '--premium-light-ink': colors.light[0],
              '--premium-light-deep': colors.light[1],
              '--premium-light-shine': colors.light[2],
              '--premium-dark-ink': colors.dark[0],
              '--premium-dark-deep': colors.dark[1],
              '--premium-dark-shine': colors.dark[2],
            } as CSSProperties)
          : undefined
      }
    >
      {item.name}
    </span>
  )
}

const PALETTES: Record<string, [string, string, string]> = {
  flame: ['#fb923c', '#ef4444', '#fde68a'],
  fire: ['#fb923c', '#ef4444', '#fde68a'],
  football: ['#34d399', '#059669', '#a7f3d0'],
  detective: ['#60a5fa', '#4f46e5', '#bae6fd'],
  manga: ['#f472b6', '#a855f7', '#fbcfe8'],
  builder: ['#fbbf24', '#d97706', '#fef08a'],
  space: ['#a78bfa', '#6366f1', '#c4b5fd'],
  water: ['#38bdf8', '#2563eb', '#a5f3fc'],
  lightning: ['#facc15', '#f97316', '#fef9c3'],
  ice: ['#67e8f9', '#0891b2', '#ecfeff'],
  moon: ['#c4b5fd', '#7c3aed', '#ede9fe'],
  dragon: ['#f87171', '#be123c', '#fecdd3'],
  cat: ['#60a5fa', '#6366f1', '#dbeafe'],
  robot: ['#34d399', '#0d9488', '#a7f3d0'],
  fox: ['#fb923c', '#ea580c', '#fed7aa'],
  wolf: ['#94a3b8', '#475569', '#e2e8f0'],
  phoenix: ['#fbbf24', '#ef4444', '#fef3c7'],
  mist: ['#2dd4bf', '#0f766e', '#ccfbf1'],
}
const palette = (theme = 'detective') => PALETTES[theme] ?? PALETTES.detective
const number = (n: number) => n.toLocaleString('vi-VN')

/** Dialogs use their own focus scope, so their controls never depend on global selectors. */
export function CosmeticDialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const root = useRef<HTMLElement>(null),
    close = useRef(onClose)
  close.current = onClose
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const unlock = lockBodyScroll()
    const timer = setTimeout(
      () => root.current?.querySelector<HTMLElement>('button, input')?.focus(),
      0,
    )
    const key = (e: KeyboardEvent) => {
      if (
        document
          .querySelectorAll('[role="dialog"][aria-modal="true"]')
          .item(document.querySelectorAll('[role="dialog"][aria-modal="true"]').length - 1) !==
        root.current
      )
        return
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
      }
      if (e.key !== 'Tab') return
      const nodes = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0)
      const first = nodes[0],
        last = nodes.at(-1)
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', key)
      unlock()
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="cosmetic-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose()
      }}
    >
      <section
        className={`cosmetic-dialog ${className}`}
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="cosmetic-dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="cosmetic-dialog-content">{children}</div>
      </section>
    </div>
  )
}

export function FrameArtwork({ item }: { item: ShopItem }) {
  const uid = useId().replaceAll(':', ''),
    [a, b, c] = palette(item.theme)
  if (item.artwork)
    return (
      <img
        className="cosmetic-frame-art cosmetic-frame-raster"
        src={`${import.meta.env.BASE_URL}${item.artwork}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
    )
  const tier = item.id === 'frame-starter' ? 0 : item.tier + 1
  const gems = Array.from({ length: tier >= 4 ? 12 : tier >= 2 ? 6 : 3 })
  return (
    <svg
      viewBox="0 0 200 200"
      className={`cosmetic-frame-art cosmetic-frame-${item.theme} cosmetic-tier-${tier}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={c} />
          <stop offset=".45" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      {tier >= 4 && (
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke={a}
          strokeWidth="1"
          strokeDasharray="3 10"
          className="cosmetic-orbit"
        />
      )}
      <circle cx="100" cy="100" r="68" fill="none" stroke={b} strokeWidth={tier > 2 ? 10 : 7} />
      <circle
        cx="100"
        cy="100"
        r="69"
        fill="none"
        stroke={`url(#${uid}-ring)`}
        strokeWidth={tier > 2 ? 6 : 4}
      />
      <circle cx="100" cy="100" r="62" fill="none" stroke={c} strokeWidth="1.3" opacity=".9" />
      {tier > 0 && (
        <circle
          className="cosmetic-ring-shimmer"
          cx="100"
          cy="100"
          r="69"
          fill="none"
          stroke={c}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="18 416"
        />
      )}
      {item.theme === 'flame' && (
        <g className="cosmetic-flames" fill={`url(#${uid}-ring)`}>
          <path d="M35 121C15 100 31 77 39 71c-1 14 14 17 10 34l-5 24Z" />
          <path d="M165 121c20-21 4-44-4-50 1 14-14 17-10 34l5 24Z" />
          {tier >= 2 && (
            <>
              <path d="M68 38c-8-18 8-26 6-38 18 20 14 25 8 35Z" />
              <path d="M132 38c8-18-8-26-6-38-18 20-14 25-8 35Z" />
            </>
          )}
          {tier >= 3 && (
            <>
              <path d="M36 144c-26-9-24-29-24-29 8 10 20 5 27 20Z" />
              <path d="M164 144c26-9 24-29 24-29-8 10-20 5-27 20Z" />
            </>
          )}
          {tier >= 5 && <path d="M83 30C76 9 99 10 100 0c2 13 27 18 17 30L100 40Z" />}
        </g>
      )}
      {item.theme === 'football' && (
        <g stroke={c} fill={a} strokeWidth="2">
          <path d="M38 119 24 87 34 57 48 49 46 79 56 99Z" />
          <path d="M162 119l14-32-10-30-14-8 2 30-10 20Z" />
          {tier >= 2 && (
            <g className="cosmetic-laurel">
              <path
                d="M42 139Q8 118 18 91m20 39-15-3 3-15m19 4-19-10 4-15M158 139q34-21 24-48m-20 39 15-3-3-15m-19 4 19-10-4-15"
                fill="none"
                strokeWidth="5"
              />
            </g>
          )}
          <circle cx="100" cy="32" r={tier >= 3 ? 17 : 13} fill="#f8fafc" stroke={b} />
          <path d="m100 23 8 6-3 9H95l-3-9Z" fill={b} stroke="none" />
          {tier >= 4 && <path d="m74 171 8 10 18-6 18 6 8-10-26-10Z" />}
        </g>
      )}
      {item.theme === 'detective' && (
        <g stroke={c} strokeWidth="2" fill={b}>
          <path d="m43 67-13-8 2-19 18 4 7 12M157 67l13-8-2-19-18 4-7 12" />
          <path d="m75 37 8-17h34l8 17Z" />
          <path d="M67 38h66" stroke={a} strokeWidth="7" strokeLinecap="round" />
          {tier >= 2 && (
            <>
              <circle cx="154" cy="151" r="13" fill={a} />
              <path d="m164 162 13 13" stroke={b} strokeWidth="8" strokeLinecap="round" />
              <path d="m31 138 13 14 13-14-13-15Z" fill={a} />
            </>
          )}
          {tier >= 4 && <path d="m78 169 22-9 22 9-10 18H88Z" fill={a} />}
        </g>
      )}
      {item.theme === 'manga' && (
        <g fill={a} stroke={c} strokeWidth="1.5">
          <path d="m49 70-20-3 7-17-14-11 24 2 11-19 1 29ZM151 70l20-3-7-17 14-11-24 2-11-19-1 29Z" />
          {tier >= 2 && (
            <>
              <path className="cosmetic-wing-left" d="m45 116-33-5 19 19-26 1 35 24 14-14Z" />
              <path className="cosmetic-wing-right" d="m155 116 33-5-19 19 26 1-35 24-14-14Z" />
            </>
          )}
          {tier >= 3 && <path d="m100 15 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" />}
          {tier >= 5 && <path d="m78 172 22-10 22 10-6 17H84Z" fill={b} />}
        </g>
      )}
      {item.theme === 'builder' && (
        <g fill={a} stroke={c} strokeWidth="1.5">
          <path d="M29 55h15v15H29ZM23 75h15v15H23ZM156 55h15v15h-15ZM162 75h15v15h-15ZM44 39h15v15H44ZM141 39h15v15h-15Z" />
          {tier >= 2 && (
            <path d="M14 108h16v16H14Zm156 0h16v16h-16ZM29 130h16v16H29Zm126 0h16v16h-16Z" />
          )}
          {tier >= 3 && <path d="M74 30V15h15V6h22v9h15v15h-15v10H89V30Z" fill={b} />}
          {tier >= 4 && <path d="M66 166h16v15h36v-15h16v25H66Z" />}
        </g>
      )}
      {item.theme === 'space' && (
        <g stroke={c} fill={a} strokeWidth="1.5">
          <ellipse
            className="cosmetic-orbit"
            cx="100"
            cy="100"
            rx="88"
            ry="31"
            transform="rotate(-35 100 100)"
            fill="none"
            stroke={a}
            strokeWidth={tier >= 3 ? 3 : 1.5}
          />
          <circle cx="34" cy="151" r={tier >= 2 ? 11 : 7} fill={b} />
          <circle cx="164" cy="49" r="7" />
          {tier >= 2 && <path d="m100 17 4 10 11 1-8 7 2 11-9-6-9 6 2-11-8-7 11-1Z" />}
          {tier >= 4 && (
            <>
              <circle cx="169" cy="142" r="10" fill={b} />
              <ellipse cx="169" cy="142" rx="18" ry="4" fill="none" />
              <path d="m45 28 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" />
            </>
          )}
        </g>
      )}
      {tier >= 3 && (
        <g fill={c} className="cosmetic-sparks">
          {gems.map((_, i) => {
            const angle = (i * Math.PI * 2) / gems.length,
              x = 100 + 78 * Math.cos(angle),
              y = 100 + 78 * Math.sin(angle)
            return (
              <path
                key={i}
                d={`M${x} ${y - 4}l2.5 4-2.5 4-2.5-4Z`}
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            )
          })}
        </g>
      )}
      {tier >= 5 && (
        <g fill={c} stroke={b} strokeWidth="1">
          <path d="m75 176 6-14 12 7 7-14 7 14 12-7 6 14-6 10H81Z" />
        </g>
      )}
    </svg>
  )
}

function PetArtwork({ item }: { item: ShopItem }) {
  const [a, b, c] = palette(item.theme),
    bird = item.theme === 'phoenix',
    dragon = item.theme === 'dragon',
    robot = item.theme === 'robot'
  return (
    <svg viewBox="0 0 100 110" aria-hidden="true" className={`cosmetic-pet-art pet-${item.theme}`}>
      <ellipse cx="50" cy="101" rx="29" ry="5" fill={b} opacity=".18" />
      {(bird || dragon) && (
        <g className="cosmetic-wings" fill={a} stroke={b} strokeWidth="2">
          <path d="M35 54C10 35 2 43 5 63l25 18Z" />
          <path d="M65 54c25-19 33-11 30 9L70 81Z" />
        </g>
      )}
      <path
        d="M25 83Q15 43 31 30L24 8l24 15h7L79 8l-5 28q13 24 3 48Z"
        fill={a}
        stroke={b}
        strokeWidth="3"
      />
      {robot && (
        <>
          <rect x="23" y="29" width="55" height="46" rx="8" fill={b} stroke={c} strokeWidth="3" />
          <path d="M50 26V14" stroke={b} strokeWidth="4" />
          <circle cx="50" cy="11" r="5" fill={a} />
        </>
      )}
      {bird && <path d="M32 29 40 7l9 16L62 4l-1 26Z" fill={c} stroke={b} strokeWidth="2" />}
      <path d="M31 64q18-21 38 0l-4 22H36Z" fill={c} />
      <ellipse cx="37" cy="49" rx="4" ry="6" fill="#172554" />
      <ellipse cx="63" cy="49" rx="4" ry="6" fill="#172554" />
      <circle cx="38" cy="47" r="1.5" fill="white" />
      <circle cx="64" cy="47" r="1.5" fill="white" />
      <path d="m46 62 4 4 4-4Z" fill={b} />
      <path d="M42 72q8 8 16 0" fill="none" stroke={b} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="35" cy="91" rx="14" ry="8" fill={b} />
      <ellipse cx="66" cy="91" rx="14" ry="8" fill={b} />
      {item.theme === 'cat' && (
        <>
          <path d="m23 31 9-14h31l10 14Z" fill={b} />
          <path d="M18 33h61" stroke={b} strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {dragon && <path d="m78 80 15-10-3 20-16 6" fill={a} stroke={b} strokeWidth="2" />}
    </svg>
  )
}

function WeaponArtwork({ item }: { item: ShopItem }) {
  const uid = useId().replaceAll(':', ''),
    [a, b, c] = palette(item.theme)
  return (
    <svg
      viewBox="0 0 80 210"
      aria-hidden="true"
      className={`cosmetic-weapon-art weapon-${item.theme} weapon-tier-${item.tier}`}
    >
      <defs>
        <linearGradient id={`${uid}-blade`} x1="0" x2="1">
          <stop stopColor={b} />
          <stop offset=".45" stopColor={c} />
          <stop offset=".6" stopColor="white" />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      {item.tier > 0 && (
        <path
          className="cosmetic-weapon-aura"
          d="M32 151C7 124 49 98 18 76c23 7 7-31 32-63 4 40 27 44 13 76s18 42-14 65Z"
          fill={a}
          opacity=".28"
        />
      )}
      <path
        d="M37 148 32 42 49 6l5 37-5 105Z"
        fill={`url(#${uid}-blade)`}
        stroke={b}
        strokeWidth="2"
      />
      <path d="m44 28 1 112" stroke="white" strokeWidth="1.5" opacity=".9" />
      {item.theme === 'lightning' && (
        <path d="m43 50-6 26 9-5-5 28 9-9" fill="none" stroke={a} strokeWidth="4" />
      )}
      {item.theme === 'water' && (
        <path d="M37 63q13 10 2 23t5 24" fill="none" stroke={a} strokeWidth="3" />
      )}
      {item.theme === 'moon' && <path d="M45 65q-16 10 1 20-9-10-1-20" fill={b} />}
      <path d="m22 145 19-7 20 7-4 13H27Z" fill={a} stroke={b} strokeWidth="3" />
      <rect x="35" y="156" width="13" height="40" rx="4" fill={b} />
      <path d="m35 163 13 8-13 8 13 8" fill="none" stroke={c} strokeWidth="3" />
      <circle cx="41" cy="199" r="7" fill={a} stroke={b} strokeWidth="2" />
    </svg>
  )
}

const avatarCache = new WeakMap<
  Repository,
  Map<string, { url: Promise<string>; expires: number }>
>()
function useAvatarUrl(repo: Repository, path: string | null) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let alive = true
    const refresh = () => {
      setUrl('')
      if (!path) return
      let cache = avatarCache.get(repo)
      if (!cache) {
        cache = new Map()
        avatarCache.set(repo, cache)
      }
      let entry = cache.get(path)
      if (!entry || entry.expires < Date.now()) {
        entry = { url: repo.avatarUrl(path), expires: Date.now() + 45 * 60 * 1000 }
        cache.set(path, entry)
      }
      void entry.url
        .then((value) => {
          if (alive) setUrl(value)
        })
        .catch(() => {
          cache?.delete(path)
          if (alive) setUrl('')
        })
    }
    refresh()
    const timer = setInterval(refresh, 45 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [repo, path])
  return url
}

export function ProfileAvatar({
  data,
  repo,
  size = 'large',
  preview,
  animated = true,
  avatarUrlOverride,
}: {
  data: Snapshot
  repo: Repository
  size?: 'small' | 'large' | 'hero'
  preview?: Partial<Record<CosmeticCategory, string>>
  animated?: boolean
  avatarUrlOverride?: string
}) {
  const game = gameState(data),
    equipped = { ...game.equipped, ...preview }
  const frame = itemById(equipped.frame),
    banner = itemById(equipped.banner),
    title = itemById(equipped.title)
  const pet = itemById(equipped.pet)
  const uploaded = useAvatarUrl(repo, game.avatarPath),
    [failed, setFailed] = useState(false)
  const url = avatarUrlOverride ?? uploaded
  useEffect(() => setFailed(false), [url])
  const colors = palette(banner?.theme ?? frame?.theme)
  const style = {
    '--cosmetic-a': colors[0],
    '--cosmetic-b': colors[1],
    '--cosmetic-c': colors[2],
  } as CSSProperties
  return (
    <div
      className={`profile-cosmetic profile-cosmetic-${size} ${animated ? 'cosmetic-animated' : 'cosmetic-static'}`}
      style={style}
    >
      <div
        className={`profile-cosmetic-stage ${banner ? `has-banner banner-${banner.theme} banner-tier-${banner.tier}` : ''}`}
      >
        {banner && (
          <div className="cosmetic-banner-pattern" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        )}
        <div className="profile-cosmetic-picture">
          {url && !failed ? (
            <img
              src={url}
              alt={`Avatar của ${data.profile?.name ?? 'Conan'}`}
              onError={() => setFailed(true)}
            />
          ) : (
            <span aria-label={`Avatar ${data.profile?.name ?? 'Conan'}`}>
              {(data.profile?.name ?? 'C').slice(0, 1).toLocaleUpperCase('vi-VN')}
            </span>
          )}
        </div>
        {frame && <FrameArtwork item={frame} />}
        {pet && (
          <span className="profile-cosmetic-pet">
            <PetArtwork item={pet} />
          </span>
        )}
      </div>
      {size !== 'small' && title && (
        <span
          className={`cosmetic-nameplate title-${title.theme} title-tier-${title.tier}`}
          style={{ '--title-color': palette(title.theme)[0] } as CSSProperties}
        >
          <Shield size={12} />
          {title.name}
        </span>
      )}
    </div>
  )
}

export function CosmeticArt({ item }: { item: ShopItem }) {
  if (item.category === 'weapon') return <WeaponArtwork item={item} />
  if (item.category === 'pet') return <PetArtwork item={item} />
  if (item.category === 'frame') return <FrameArtwork item={item} />
  if (item.category === 'celebration') return <CelebrationSymbol theme={item.theme} size={100} />
  return (
    <span
      className={`cosmetic-item-emblem cosmetic-item-emblem-${item.category}`}
      style={
        {
          '--cosmetic-a': palette(item.theme)[0],
          '--cosmetic-b': palette(item.theme)[1],
        } as CSSProperties
      }
    >
      {item.category === 'title' ? (
        <>
          <Shield size={30} />
          <span>{item.name}</span>
        </>
      ) : (
        <>
          <i />
          <Sparkles size={32} />
          <i />
        </>
      )}
    </span>
  )
}

export function AvatarStudio({
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
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(''),
    [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null),
    canEdit = data.actor.role !== 'parent'
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <CosmeticDialog
      title="Góc cá nhân của Conan"
      onClose={onClose}
      className="avatar-studio-dialog"
    >
      <div className="avatar-studio-preview">
        <ProfileAvatar
          data={data}
          repo={repo}
          size="hero"
          avatarUrlOverride={preview || undefined}
        />
        <strong>{data.profile?.name}</strong>
        <span>Ảnh của em. Phong cách của em.</span>
      </div>
      <p className="cosmetic-muted">
        Chọn ảnh vuông hoặc ảnh có khuôn mặt ở giữa để hiển thị đẹp trong khung tròn. Khung và bạn
        đồng hành được thay ở Shop.
      </p>
      {canEdit ? (
        <>
          <input
            ref={input}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const next = event.target.files?.[0]
              event.target.value = ''
              if (!next) return
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
                setError('Chọn ảnh JPG, PNG hoặc WebP.')
                return
              }
              if (next.size > 5 * 1024 * 1024) {
                setError('Ảnh cần nhỏ hơn hoặc bằng 5 MB.')
                return
              }
              setError('')
              setFile(next)
            }}
          />
          <div className="avatar-studio-buttons">
            <Button className="secondary" disabled={busy} onClick={() => input.current?.click()}>
              <ImagePlus size={17} />
              {file ? 'Chọn ảnh khác' : 'Tải ảnh của em'}
            </Button>
            {gameState(data).avatarPath && (
              <Button
                className="secondary"
                busy={busy}
                onClick={async () => {
                  setError('')
                  if (
                    await run(
                      () => repo.gameAction({ type: 'avatar', path: null }),
                      'Đã gỡ ảnh đại diện.',
                    )
                  )
                    setFile(null)
                  else setError('Chưa gỡ được ảnh. Em thử lại nhé.')
                }}
              >
                <Trash2 size={16} />
                Gỡ ảnh
              </Button>
            )}
          </div>
          <small className="cosmetic-muted">
            JPG, PNG hoặc WebP · tối đa 5 MB · ảnh chỉ hiển thị trong gia đình
          </small>
          {file && (
            <p className="avatar-file-selected">
              <Check size={16} />
              <span>{file.name}</span>
            </p>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="cosmetic-dialog-actions">
            <Button className="secondary" disabled={busy} onClick={onClose}>
              Đóng
            </Button>
            <Button
              busy={busy}
              disabled={!file}
              onClick={async () => {
                if (!file) return
                setError('')
                if (
                  await run(async () => {
                    const path = await repo.uploadAvatar(file)
                    await repo.gameAction({ type: 'avatar', path })
                  }, 'Đã lưu avatar mới của em.')
                )
                  onClose()
                else setError('Chưa xác nhận lưu ảnh. Ảnh đã chọn vẫn ở đây để em thử lại.')
              }}
            >
              <Camera size={16} />
              Lưu avatar
            </Button>
          </div>
        </>
      ) : (
        <p className="cosmetic-readonly">Conan hoặc người hướng dẫn có thể thay ảnh đại diện.</p>
      )}
    </CosmeticDialog>
  )
}

export function StreakFlame({
  count,
  extra = false,
  size = 32,
}: {
  count: number
  extra?: boolean
  size?: number
}) {
  const uid = useId().replaceAll(':', '')
  return (
    <span
      className={`streak-flame ${count > 0 ? 'streak-lit' : 'streak-unlit'} ${extra ? 'streak-extra' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${count} ngày streak${extra ? ', có nỗ lực thêm' : ''}`}
    >
      <svg viewBox="0 0 100 112" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor={extra ? '#a78bfa' : '#fb923c'} />
            <stop offset=".45" stopColor={extra ? '#7c3aed' : '#f97316'} />
            <stop offset="1" stopColor={extra ? '#db2777' : '#ef4444'} />
          </linearGradient>
        </defs>
        <path
          className="streak-flame-outer"
          d="M51 2c11 26 35 31 33 58 10-8 9-18 9-18 18 45-5 66-40 68C13 111-4 79 10 50c0 16 10 17 13 23C13 38 48 31 51 2Z"
          fill={`url(#${uid}-flame)`}
        />
        <path
          className="streak-flame-inner"
          d="M54 48c3 19 22 24 17 42-3 12-16 19-29 14-22-9-15-31-3-39-3 14 8 14 8 20 7-10-1-20 7-37Z"
          fill={extra ? '#e9d5ff' : '#fde68a'}
        />
        <path d="m56 77 8 16-9 9-10-7Z" fill="white" opacity=".75" />
        {extra && (
          <g className="streak-sparkles" fill="#fcd34d">
            <path d="m13 17 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM87 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
          </g>
        )}
      </svg>
    </span>
  )
}

export function MilestoneCelebration({
  milestones,
  styleId,
  onClose,
}: {
  milestones: Array<{ key: string; label: string; count: number }>
  styleId?: string
  onClose: () => void
}) {
  const close = useRef(onClose),
    button = useRef<HTMLButtonElement>(null),
    root = useRef<HTMLDivElement>(null)
  close.current = onClose
  const highest = Math.max(...milestones.map((item) => item.count), 0)
  const theme = itemById(styleId)?.theme ?? 'flame',
    colors = celebrationStyle(theme).colors
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      unlock = lockBodyScroll()
    button.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      if (dialogs.item(dialogs.length - 1) !== root.current) return
      if (e.key === 'Escape') close.current()
      if (e.key === 'Tab') {
        e.preventDefault()
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', key)
    const timer = setTimeout(() => close.current(), 4500)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', key)
      unlock()
      previous?.focus()
    }
  }, [])
  return (
    <div
      ref={root}
      className={`milestone-celebration celebration-theme-${theme}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-celebration-title"
      style={
        {
          '--celebration-a': colors[0],
          '--celebration-b': colors[1],
          '--celebration-c': colors[2],
        } as CSSProperties
      }
    >
      <div className="celebration-stars" aria-hidden="true">
        {Array.from({ length: 54 }, (_, i) => (
          <i
            key={i}
            style={
              {
                '--x': `${(i * 37 + 13) % 100}%`,
                '--y': `${(i * 53 + 7) % 100}%`,
                '--delay': `${(i % 9) * -0.35}s`,
                '--duration': `${2.1 + (i % 5) * 0.3}s`,
                '--particle-size': `${3 + (i % 5)}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="celebration-fireworks" aria-hidden="true">
        {Array.from({ length: 7 }, (_, n) => (
          <span
            className="celebration-firework"
            key={n}
            style={
              {
                '--burst-x': `${12 + n * 13}%`,
                '--burst-y': `${18 + (n % 3) * 23}%`,
                '--burst-delay': `${n * 0.21}s`,
              } as CSSProperties
            }
          >
            {Array.from({ length: 12 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    '--angle': `${i * 30}deg`,
                    '--distance': `${65 + (n % 3) * 25}px`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </div>
      <section className="celebration-content">
        <span className="celebration-eyebrow">
          <Sparkles size={18} />
          MỘT CỘT MỐC MỚI!
        </span>
        <div className="celebration-flame">
          <CelebrationSymbol theme={theme} size={230} />
          <strong>{number(highest)}</strong>
        </div>
        <h1 id="milestone-celebration-title">{number(highest)} ngày bền bỉ!</h1>
        <p>Mỗi ngày một chút. Em đã làm được điều này.</p>
        <div className="celebration-achievements">
          {milestones.slice(0, 8).map((item) => (
            <span key={item.key}>
              <Check size={15} />
              {item.label} · {number(item.count)} ngày
            </span>
          ))}
          {milestones.length > 8 && (
            <span>Và {milestones.length - 8} cột mốc khác trong hành trình của em.</span>
          )}
        </div>
        <button className="celebration-continue" ref={button} onClick={onClose}>
          Tiếp tục hành trình <Sparkles size={17} />
        </button>
      </section>
    </div>
  )
}
