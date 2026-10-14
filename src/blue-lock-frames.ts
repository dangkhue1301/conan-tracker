import type { ShopItem } from './gamification-types'

const characters = [
  {
    slug: 'kunigami',
    name: 'Kunigami',
    theme: 'fire',
    description: 'Rensuke Kunigami giữa lửa cam, cánh đen, vòng thép và những sợi xích rực sáng.',
    light: ['#c2410c', '#b45309', '#9a3412'],
    dark: ['#fb923c', '#fbbf24', '#ffedd5'],
  },
  {
    slug: 'aiku',
    name: 'Aiku',
    theme: 'football',
    description:
      'Oliver Aiku với vòng vảy rắn xanh ngọc, giáp bạc, dải đỏ vàng và quả bóng bừng sáng.',
    light: ['#047857', '#a16207', '#b91c1c'],
    dark: ['#34d399', '#fde68a', '#fb7185'],
  },
  {
    slug: 'chigiri',
    name: 'Chigiri',
    theme: 'manga',
    description: 'Hyoma Chigiri giữa lửa hồng đỏ, đôi mắt báo, vuốt thép và những tia sáng tốc độ.',
    light: ['#be123c', '#be185d', '#c2410c'],
    dark: ['#fb7185', '#f472b6', '#fed7aa'],
  },
  {
    slug: 'nagi',
    name: 'Nagi',
    theme: 'wolf',
    description:
      'Seishiro Nagi cùng vòng bạc trắng đen, mảnh ghép, lưới bóng, dây xích và lửa trắng.',
    light: ['#475569', '#334155', '#64748b'],
    dark: ['#e2e8f0', '#94a3b8', '#f8fafc'],
  },
  {
    slug: 'rin',
    name: 'Rin',
    theme: 'mist',
    description: 'Rin Itoshi giữa lửa xanh ngọc và đen, đường lưới sắc nét cùng quả bóng ánh sáng.',
    light: ['#0f766e', '#0369a1', '#047857'],
    dark: ['#2dd4bf', '#38bdf8', '#99f6e4'],
  },
  {
    slug: 'bachira',
    name: 'Bachira',
    theme: 'lightning',
    description: 'Meguru Bachira cùng quái vật mắt vàng, vòng lửa vàng xanh, dây xích và quả bóng.',
    light: ['#a16207', '#0369a1', '#b45309'],
    dark: ['#facc15', '#38bdf8', '#fef9c3'],
  },
  {
    slug: 'isagi',
    name: 'Isagi',
    theme: 'water',
    description: 'Yoichi Isagi với mảnh ghép phát sáng, dấu ngắm sân bóng và vòng lửa xanh tím.',
    light: ['#1d4ed8', '#047857', '#7e22ce'],
    dark: ['#38bdf8', '#34d399', '#c4b5fd'],
  },
  {
    slug: 'sae',
    name: 'Sae',
    theme: 'manga',
    description:
      'Sae Itoshi giữa hoa hồng đỏ, dây gai, viền vàng và những đường số trên vòng khung.',
    light: ['#9f1239', '#be185d', '#a16207'],
    dark: ['#fb7185', '#f9a8d4', '#fde68a'],
  },
] as const

export const BLUE_LOCK_FRAMES: ShopItem[] = characters.map((character) => ({
  id: `frame-blue-lock-${character.slug}`,
  name: `${character.name} - Premium`,
  description: character.description,
  category: 'frame',
  theme: character.theme,
  collection: 'blue-lock',
  premium: true,
  artwork: `cosmetics/blue-lock/${character.slug}-frame.png`,
  namePalette: { light: character.light, dark: character.dark },
  tier: 3,
  price: 4000,
  streakRequired: 40,
  extraRequired: 0,
}))
