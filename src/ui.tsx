import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Camera, Check, X, LoaderCircle, ImagePlus } from 'lucide-react'
import type { AvatarId, Repository } from './types'

let bodyLocks = 0
let originalOverflow = ''
export function lockBodyScroll() {
  if (bodyLocks++ === 0) {
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  let unlocked = false
  return () => {
    if (unlocked) return
    unlocked = true
    if (--bodyLocks === 0) document.body.style.overflow = originalOverflow
  }
}

export const avatarSrc = (avatar: AvatarId) => `${import.meta.env.BASE_URL}avatars/${avatar}.png`
export function Avatar({
  avatar,
  size = '',
  onClick,
}: {
  avatar: AvatarId
  size?: string
  onClick?: () => void
}) {
  const picture = (
    <img src={avatarSrc(avatar)} alt="Avatar em đã chọn" className={`avatar ${size}`} />
  )
  return onClick ? (
    <button className="avatar-button" onClick={onClick} aria-label="Chọn avatar và màu">
      {picture}
      <span>
        <Camera size={12} />
      </span>
    </button>
  ) : (
    picture
  )
}
export function Asset({
  path,
  repo,
  alt,
  className = '',
}: {
  path: string | null
  repo: Repository
  alt: string
  className?: string
}) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let alive = true
    const refresh = () => {
      if (path)
        void repo
          .assetUrl(path)
          .then((value) => {
            if (alive) setUrl(value)
          })
          .catch(() => {
            if (alive) setUrl('')
          })
      else setUrl('')
    }
    refresh()
    const timer = setInterval(refresh, 50 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [path, repo])
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : null
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const close = useRef(onClose)
  const dialog = useRef<HTMLElement>(null)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const unlock = lockBodyScroll()
    const key = (e: KeyboardEvent) => {
      if (
        Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).at(-1) !==
        dialog.current
      )
        return
      if (e.key === 'Escape') close.current()
      if (e.key === 'Tab') {
        const nodes = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>('button, input, textarea, select, a') ?? [],
        ).filter((n) => !n.hasAttribute('disabled') && n.getClientRects().length > 0)
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
    }
    document.addEventListener('keydown', key)
    const timer = setTimeout(
      () => dialog.current?.querySelector<HTMLElement>('button, input')?.focus(),
      0,
    )
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', key)
      unlock()
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}
export function Button({
  children,
  busy,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`button ${props.className ?? ''}`}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  )
}
export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}
export function ImageField({
  path,
  setPath,
  repo,
  label = 'Ảnh minh hoạ',
  busy,
  onUploadState,
}: {
  path: string | null
  setPath: (v: string | null) => void
  repo: Repository
  label?: string
  busy?: boolean
  onUploadState?: (v: boolean) => void
}) {
  const [uploading, setUploading] = useState(false),
    [error, setError] = useState('')
  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      {path && <Asset path={path} repo={repo} alt={label} className="image-preview" />}
      <label className={`button secondary ${uploading || busy ? 'disabled' : ''}`}>
        <ImagePlus size={16} />
        {uploading ? 'Đang tải ảnh…' : path ? 'Đổi ảnh' : 'Chọn ảnh'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={uploading || busy}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setError('')
            setUploading(true)
            onUploadState?.(true)
            try {
              setPath(await repo.upload(file))
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setUploading(false)
              onUploadState?.(false)
              e.target.value = ''
            }
          }}
        />
      </label>
      {path && (
        <button
          className="text-button"
          type="button"
          disabled={busy || uploading}
          onClick={() => setPath(null)}
        >
          Gỡ ảnh
        </button>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <small>JPG, PNG hoặc WebP · tối đa 5 MB</small>
      {uploading && <p className="muted">Chờ ảnh tải xong trước khi lưu.</p>}
    </div>
  )
}
export function CheckMark({ checked, partial = false }: { checked: boolean; partial?: boolean }) {
  return (
    <span className={`check-square ${checked ? 'checked' : ''} ${partial ? 'partial' : ''}`}>
      {checked ? <Check size={17} strokeWidth={3} /> : partial ? <span /> : null}
    </span>
  )
}
