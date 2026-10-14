import { useId, type CSSProperties } from 'react'
import { LEAGUES } from './gamification'
import './rank-badges.css'

const materials = [
  { color: '#b66832', light: '#ffce98', mid: '#d69056', dark: '#763c20' },
  { color: '#718599', light: '#f6fcff', mid: '#b9c9d5', dark: '#526879' },
  { color: '#bc890b', light: '#fff2a0', mid: '#edbe39', dark: '#946315' },
  { color: '#2856d7', light: '#88adff', mid: '#3465e9', dark: '#132f83' },
  { color: '#d52c53', light: '#ffadc4', mid: '#f14770', dark: '#8a153a' },
  { color: '#159765', light: '#9af5c4', mid: '#2aca84', dark: '#126144' },
  { color: '#9745c7', light: '#eac3ff', mid: '#b46be7', dark: '#62268c' },
  { color: '#a88954', light: '#fffdf2', mid: '#eadcc0', dark: '#9e8256' },
  { color: '#575165', light: '#a8a1b9', mid: '#423c54', dark: '#171323' },
  { color: '#159bac', light: '#e0ffff', mid: '#68dee9', dark: '#227788' },
] as const

function materialFor(tier: number) {
  return materials[tier] ?? materials[0]
}

export function leagueRankStyle(tier: number): CSSProperties {
  const material = materialFor(tier)
  return {
    '--rank-color': material.color,
    '--rank-light': material.light,
    '--rank-tint': `${material.color}14`,
  } as CSSProperties
}

/** Each league has its own silhouette and material, including the leagues still ahead. */
export function LeagueBadge({
  tier,
  size = 64,
  decorative = false,
}: {
  tier: number
  size?: number
  decorative?: boolean
}) {
  const id = `league-${useId().replace(/:/g, '')}`
  const selectedTier = tier >= 0 && tier < LEAGUES.length ? tier : 0
  const material = materialFor(selectedTier)
  const metal = `url(#${id}-metal)`
  const shine = `url(#${id}-shine)`
  const outline = material.dark
  return (
    <svg
      className={`league-badge league-badge-${selectedTier}`}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : `${id}-title`}
      focusable="false"
    >
      {!decorative && <title id={`${id}-title`}>Huy hiệu {LEAGUES[selectedTier]}</title>}
      <defs>
        <linearGradient id={`${id}-metal`} x1=".1" y1="0" x2=".85" y2="1">
          <stop stopColor={material.light} />
          <stop offset=".38" stopColor={material.mid} />
          <stop offset=".7" stopColor={material.dark} />
          <stop offset="1" stopColor={material.mid} />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx=".35" cy=".25" r=".8">
          <stop stopColor="#fff" stopOpacity=".85" />
          <stop offset=".55" stopColor={material.light} stopOpacity=".3" />
          <stop offset="1" stopColor={material.mid} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g strokeLinejoin="round" strokeLinecap="round">
        {selectedTier === 0 && (
          <>
            <path
              d="M28 11H42L46 34L34 44L23 18Z M54 11H68L73 18L62 44L50 34Z"
              fill="#b46738"
              stroke="#743e25"
              strokeWidth="2"
            />
            <path d="M31 13H36L41 34L35 39Z M61 13H65L68 18L59 37L54 34Z" fill="#edaf72" />
            <circle cx="48" cy="55" r="30" fill={metal} stroke={outline} strokeWidth="2.5" />
            <circle cx="48" cy="55" r="24" fill="none" stroke={material.light} strokeWidth="2" />
            <path
              d="M48 36L53 47L65 49L56 58L58 70L48 64L37 70L40 58L31 49L43 47Z"
              fill={material.light}
              stroke={outline}
              strokeWidth="1.5"
            />
            <path d="M48 36V64L40 58L31 49L43 47Z" fill={material.mid} opacity=".8" />
            <path d="M25 45Q31 30 46 30" fill="none" stroke="#fff0df" strokeWidth="3" />
          </>
        )}
        {selectedTier === 1 && (
          <>
            <path
              d="M35 39L10 20L15 43L32 51L10 43L18 61L33 62L18 61L29 75L42 67 M61 39L86 20L81 43L64 51L86 43L78 61L63 62L78 61L67 75L54 67"
              fill={metal}
              stroke={outline}
              strokeWidth="2"
            />
            <path
              d="M14 27L33 43 M17 48L33 55 M82 27L63 43 M79 48L63 55"
              fill="none"
              stroke={material.light}
              strokeWidth="2"
            />
            <path
              d="M48 18L68 36V63L48 83L28 63V36Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2"
            />
            <path
              d="M48 26L61 40V59L48 73L35 59V40Z"
              fill={shine}
              stroke={material.light}
              strokeWidth="1.5"
            />
            <path
              d="M48 34L52 46L63 47L54 54L57 65L48 59L39 65L42 54L33 47L44 46Z"
              fill="#eef7fe"
              stroke={outline}
              strokeWidth="1.5"
            />
          </>
        )}
        {selectedTier === 2 && (
          <>
            <path
              d="M19 73L12 30L33 46L48 19L63 46L84 30L77 73Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2.5"
            />
            <path d="M19 67H77V80H19Z" fill={metal} stroke={outline} strokeWidth="2" />
            <path d="M25 71H71" stroke={material.light} strokeWidth="3" />
            <path d="M48 44L55 53L48 63L41 53Z" fill="#fff9cd" stroke={outline} strokeWidth="1.5" />
            <circle cx="12" cy="27" r="5" fill={material.light} stroke={outline} strokeWidth="2" />
            <circle cx="48" cy="15" r="5" fill={material.light} stroke={outline} strokeWidth="2" />
            <circle cx="84" cy="27" r="5" fill={material.light} stroke={outline} strokeWidth="2" />
            <path d="M23 46L27 58 M71 46L68 58" stroke={material.light} strokeWidth="3" />
          </>
        )}
        {selectedTier === 3 && (
          <>
            <path
              d="M48 9L76 24L87 52L66 78L48 88L30 78L9 52L20 24Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2.5"
            />
            <path
              d="M48 9L59 30L76 24L68 49L87 52L61 60L66 78L48 67L30 78L35 60L9 52L28 49L20 24L37 30Z"
              fill={material.light}
              opacity=".5"
            />
            <path
              d="M37 30L59 30L68 49L48 67L28 49Z"
              fill={material.mid}
              stroke={material.light}
              strokeWidth="1.5"
            />
            <path
              d="M48 9V30L28 49L48 67V88 M59 30L48 49L68 49 M48 49V67"
              fill="none"
              stroke={outline}
              strokeWidth="1.7"
            />
            <path d="M25 27L42 18" stroke="#d8e6ff" strokeWidth="3" />
          </>
        )}
        {selectedTier === 4 && (
          <>
            <path
              d="M26 13H70L88 48L70 83H26L8 48Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2.5"
            />
            <path
              d="M26 13L35 32H61L70 13 M8 48L28 48L35 32 M88 48H68L61 32 M26 83L35 64L28 48 M70 83L61 64L68 48"
              fill="none"
              stroke={material.light}
              strokeWidth="2"
            />
            <path
              d="M35 32H61L68 48L61 64H35L28 48Z"
              fill={material.mid}
              stroke={outline}
              strokeWidth="1.5"
            />
            <path
              d="M35 32L61 64 M61 32L35 64 M8 48H88"
              stroke={outline}
              strokeWidth="1.5"
              opacity=".6"
            />
            <path d="M25 21H63L67 26H30Z" fill="#ffe0ea" />
            <path d="M17 45L21 34" stroke="#fff" strokeWidth="2.5" />
          </>
        )}
        {selectedTier === 5 && (
          <>
            <path
              d="M23 22L41 37L36 73L18 63Z M73 22L55 37L60 73L78 63Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2"
            />
            <path
              d="M48 7L67 28V70L48 88L29 70V28Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2.5"
            />
            <path
              d="M48 7L39 31V66L48 88 M48 7L57 31V66L48 88 M29 28L39 31H57L67 28 M29 70L39 66H57L67 70"
              fill="none"
              stroke={material.light}
              strokeWidth="1.5"
            />
            <path d="M39 31H57V66H39Z" fill={material.light} opacity=".45" />
            <path d="M48 18L43 33V58" fill="none" stroke="#e7fff2" strokeWidth="3" />
          </>
        )}
        {selectedTier === 6 && (
          <>
            <circle cx="48" cy="48" r="29" fill="none" stroke={material.mid} strokeWidth="2" />
            <path
              d="M48 6L58 29L81 15L68 38L91 48L68 58L81 81L58 68L48 91L38 68L15 81L29 58L6 48L29 38L15 15L38 29Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2"
            />
            <path
              d="M48 23L65 48L48 74L31 48Z"
              fill={material.light}
              stroke={outline}
              strokeWidth="2"
            />
            <path d="M48 23L48 74L31 48Z" fill={material.mid} />
            <path d="M48 33L56 48L48 62L40 48Z" fill={shine} />
            <circle cx="15" cy="15" r="2" fill={material.light} />
          </>
        )}
        {selectedTier === 7 && (
          <>
            <path
              d="M10 60Q6 31 27 23Q45 12 48 28Q53 12 71 23Q92 31 86 60L67 81H29Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2"
            />
            <path
              d="M18 38L39 73 M30 28L43 72 M48 27V72 M66 28L53 72 M78 38L57 73 M14 55L34 76 M82 55L62 76"
              stroke={material.light}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M28 73Q48 87 68 73L60 86H36Z"
              fill={metal}
              stroke={outline}
              strokeWidth="1.8"
            />
            <circle
              cx="48"
              cy="48"
              r="21"
              fill={material.light}
              stroke={outline}
              strokeWidth="1.5"
            />
            <circle cx="48" cy="48" r="20" fill={shine} />
            <path d="M34 45Q35 32 47 33" fill="none" stroke="#fff" strokeWidth="4" />
            <path d="M47 62Q58 60 62 50" stroke="#d2be97" strokeWidth="2" fill="none" />
          </>
        )}
        {selectedTier === 8 && (
          <>
            <path
              d="M46 7L73 24L66 43L77 57L54 77L48 90L32 67L19 61L29 41L23 27Z"
              fill={metal}
              stroke={outline}
              strokeWidth="2.5"
            />
            <path
              d="M46 7L44 37L32 67L48 90L54 55L66 43L73 24Z"
              fill={material.dark}
              stroke="#c2b5d6"
              strokeWidth="1.5"
            />
            <path
              d="M46 7L54 30L44 37L54 55L48 90"
              fill="none"
              stroke={material.light}
              strokeWidth="2"
            />
            <path
              d="M24 26L33 28L44 20 M66 44L60 53L65 57"
              fill="none"
              stroke="#e2d2f5"
              strokeWidth="2"
            />
            <path d="M16 78L10 85 M77 72L84 80 M74 13L80 8" stroke={material.mid} strokeWidth="3" />
          </>
        )}
        {selectedTier === 9 && (
          <>
            <path d="M27 16H69L87 37L48 85L9 37Z" fill={metal} stroke={outline} strokeWidth="2.5" />
            <path
              d="M27 16L35 37L48 16L61 37L69 16 M9 37H87 M35 37L48 85L61 37"
              fill="none"
              stroke="#f3ffff"
              strokeWidth="2"
            />
            <path d="M48 16L61 37L48 85L35 37Z" fill="#c3ffff" opacity=".75" />
            <path d="M9 37L35 37L48 85Z M69 16L61 37H87Z" fill={material.mid} opacity=".6" />
            <path d="M27 16L35 37L48 16Z" fill="#fff" opacity=".8" />
            <path
              d="M13 10V20 M8 15H18 M82 59V73 M75 66H89"
              stroke={material.color}
              strokeWidth="2.5"
            />
            <path d="M48 43L48 66" stroke="#fff" strokeWidth="3" opacity=".8" />
          </>
        )}
      </g>
    </svg>
  )
}
