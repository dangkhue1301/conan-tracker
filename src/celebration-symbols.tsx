import { useId } from 'react'

export interface CelebrationStyle {
  label: string
  symbol: 'flame' | 'lightning' | 'diamond' | 'crown' | 'crystal' | 'shooting-star'
  colors: [string, string, string]
}

/** These colors belong to milestone effects, independently of profile cosmetics. */
export const CELEBRATION_STYLES: Record<string, CelebrationStyle> = {
  flame: { label: 'Lửa cam', symbol: 'flame', colors: ['#f97316', '#c2410c', '#ffedd5'] },
  football: {
    label: 'Tia chớp vàng',
    symbol: 'lightning',
    colors: ['#facc15', '#a16207', '#fef9c3'],
  },
  detective: {
    label: 'Kim cương xanh ngọc',
    symbol: 'diamond',
    colors: ['#06b6d4', '#0e7490', '#cffafe'],
  },
  manga: { label: 'Vương miện tím', symbol: 'crown', colors: ['#8b5cf6', '#6d28d9', '#ede9fe'] },
  builder: {
    label: 'Khiên pha lê lục bảo',
    symbol: 'crystal',
    colors: ['#10b981', '#047857', '#d1fae5'],
  },
  space: {
    label: 'Sao băng hồng',
    symbol: 'shooting-star',
    colors: ['#ec4899', '#be185d', '#fce7f3'],
  },
}

export function celebrationStyle(theme?: string): CelebrationStyle {
  return CELEBRATION_STYLES[theme ?? 'flame'] ?? CELEBRATION_STYLES.flame
}

/** Static artwork in the shop; only its fullscreen parent adds milestone motion. */
export function CelebrationSymbol({ theme, size = 90 }: { theme?: string; size?: number }) {
  const uid = useId().replaceAll(':', ''),
    style = celebrationStyle(theme),
    [a, b, c] = style.colors
  return (
    <span
      className={`celebration-symbol celebration-symbol-${style.symbol}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={style.label}
    >
      <svg viewBox="0 0 128 144" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-symbol`} x1=".2" y1="0" x2=".85" y2="1">
            <stop stopColor={c} />
            <stop offset=".38" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        {style.symbol === 'flame' && (
          <>
            <path
              d="M66 6c4 23 35 33 33 60 8-5 10-13 10-13 20 39-2 75-44 78C21 134 5 100 18 67c1 14 10 17 14 24C21 51 61 37 66 6Z"
              fill={`url(#${uid}-symbol)`}
              stroke={b}
              strokeWidth="2.5"
            />
            <path
              d="M67 58c3 20 27 29 17 51-6 14-25 20-37 9-20-18-5-36 4-46-2 16 11 19 10 25 8-13-1-22 6-39Z"
              fill={c}
            />
            <path d="M69 91 79 110l-13 12-11-12Z" fill="white" />
            <path
              d="M26 35 29 44 38 47 29 50 26 59 23 50 14 47 23 44ZM101 11l2 7 7 2-7 3-2 7-3-7-7-3 7-2Z"
              fill={a}
            />
          </>
        )}
        {style.symbol === 'lightning' && (
          <>
            <path d="m66 6-40 72h31l-9 55 56-82H73L88 6Z" fill={b} transform="translate(3 3)" />
            <path
              d="m66 6-40 72h31l-9 55 56-82H73L88 6Z"
              fill={`url(#${uid}-symbol)`}
              stroke={b}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M71 17 40 67h24l-5 26 29-34H65l17-42Z" fill={c} />
            <path
              d="M15 57 6 48M108 91l13 5M106 28l10-8M21 109l-9 9"
              fill="none"
              stroke={a}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </>
        )}
        {style.symbol === 'diamond' && (
          <>
            <path
              d="m31 29 66 0 22 33-55 68L9 62Z"
              fill={`url(#${uid}-symbol)`}
              stroke={b}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="m31 29 14 33-36 0ZM97 29 83 62h36ZM45 62 64 130 83 62Z"
              fill={b}
              opacity=".7"
            />
            <path d="m45 62 19-33 19 33ZM31 29l33 0-19 33Z" fill={c} />
            <path
              d="M9 62h110M31 29l14 33 19 68 19-68 14-33M45 62l19-33 19 33"
              fill="none"
              stroke="white"
              strokeWidth="2"
              opacity=".85"
            />
            <path
              d="m106 5 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM18 99l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
              fill={a}
            />
          </>
        )}
        {style.symbol === 'crown' && (
          <>
            <path
              d="m19 44 24 18 21-39 21 39 24-18-10 62H29Z"
              fill={`url(#${uid}-symbol)`}
              stroke={b}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="m29 88 35-11 35 11-3 17H32Z" fill={b} opacity=".6" />
            <rect
              x="26"
              y="103"
              width="76"
              height="18"
              rx="7"
              fill={a}
              stroke={b}
              strokeWidth="3"
            />
            <path d="m64 64 10 15-10 15-10-15Z" fill={c} stroke="white" strokeWidth="2" />
            <circle cx="19" cy="43" r="7" fill={c} stroke={b} strokeWidth="2" />
            <circle cx="64" cy="22" r="8" fill={c} stroke={b} strokeWidth="2" />
            <circle cx="109" cy="43" r="7" fill={c} stroke={b} strokeWidth="2" />
            <path
              d="m11 80 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM104 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
              fill={a}
            />
          </>
        )}
        {style.symbol === 'crystal' && (
          <>
            <path
              d="m64 9 44 24v51l-16 28-28 22-28-22-16-28V33Z"
              fill={b}
              stroke={a}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="m64 18 36 20v44l-13 24-23 19-23-19-13-24V38Z" fill={`url(#${uid}-symbol)`} />
            <path d="m64 31 23 36-23 40-23-40Z" fill={c} stroke={b} strokeWidth="2" />
            <path d="m64 31 0 36 23 0ZM64 67l-23 0 23 40Z" fill={a} />
            <path d="M64 31v76M41 67h46" fill="none" stroke="white" strokeWidth="1.5" />
            <path
              d="m9 45 2 7 7 2-7 2-2 7-2-7-7-2 7-2ZM115 96l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"
              fill={a}
            />
          </>
        )}
        {style.symbol === 'shooting-star' && (
          <>
            <path
              d="M18 19 88 65M10 47 76 79M43 11l49 51"
              fill="none"
              stroke={b}
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M18 19 88 65M10 47 76 79M43 11l49 51"
              fill="none"
              stroke={a}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="m85 44 13 25 28 4-20 20 4 29-25-14-25 14 4-29-20-20 28-4Z"
              fill={`url(#${uid}-symbol)`}
              stroke={b}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="m85 57 8 18 20 2-15 14 3 19-16-9-17 9 4-19-15-14 20-2Z" fill={c} />
            <path d="m85 57 0 44-17 9 4-19-15-14 20-2Z" fill={a} opacity=".65" />
            <path
              d="m15 92 3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM106 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
              fill={a}
            />
          </>
        )}
      </svg>
    </span>
  )
}
