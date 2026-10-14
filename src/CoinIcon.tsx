import { useId } from 'react'

/** A filled gold coin with a raised rim and the Conan currency mark. */
export function CoinIcon({ size = 24 }: { size?: number }) {
  const id = useId().replaceAll(':', '')
  return (
    <svg
      className="coin-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`${id}-rim`}
          x1="4"
          y1="3"
          x2="19"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff4b3" />
          <stop offset=".38" stopColor="#ffd45c" />
          <stop offset="1" stopColor="#d88a0b" />
        </linearGradient>
        <linearGradient
          id={`${id}-face`}
          x1="7"
          y1="5"
          x2="17"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffe78b" />
          <stop offset=".55" stopColor="#ffc83e" />
          <stop offset="1" stopColor="#f2a51b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="13.2" r="9.5" fill="#a85c08" />
      <circle
        cx="12"
        cy="11.6"
        r="9.5"
        fill={`url(#${id}-rim)`}
        stroke="#d38c15"
        strokeWidth=".8"
      />
      <circle
        cx="12"
        cy="11.6"
        r="7.3"
        fill={`url(#${id}-face)`}
        stroke="#fff0a3"
        strokeWidth="1"
      />
      <path
        d="M5.2 9.6a7.1 7.1 0 0 1 5.7-5"
        fill="none"
        stroke="#fff9da"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M14.8 8.9a3.8 3.8 0 1 0 0 5.4"
        fill="none"
        stroke="#fff0a3"
        strokeWidth="2.2"
        strokeLinecap="round"
        transform="translate(0 .5)"
      />
      <path
        d="M14.8 8.9a3.8 3.8 0 1 0 0 5.4"
        fill="none"
        stroke="#9a5a08"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
