import type { ShopItem } from './gamification-types'

const characters = [
  {
    slug: 'giyu',
    name: 'Giyu',
    theme: 'water',
    description:
      'Thủy Trụ Giyu Tomioka giữa sóng nước xanh lam, thanh Nichirin và họa tiết haori hai màu.',
    light: ['#0369a1', '#1e40af', '#0e7490'],
    dark: ['#38bdf8', '#60a5fa', '#cffafe'],
  },
  {
    slug: 'tengen',
    name: 'Tengen',
    theme: 'lightning',
    description:
      'Âm Trụ Tengen Uzui với song đao, dây xích, đá quý và những chùm pháo hoa vàng cam.',
    light: ['#a16207', '#b45309', '#92400e'],
    dark: ['#fbbf24', '#fb923c', '#fef3c7'],
  },
  {
    slug: 'nezuko',
    name: 'Nezuko',
    theme: 'manga',
    description: 'Nezuko Kamado cùng lửa hồng, hoa anh đào, ống tre và chiếc hộp gỗ quen thuộc.',
    light: ['#be185d', '#9d174d', '#c026d3'],
    dark: ['#f472b6', '#fb7185', '#fce7f3'],
  },
  {
    slug: 'douma',
    name: 'Douma',
    theme: 'ice',
    description:
      'Thượng Huyền Nhị Douma giữa sen băng xanh trong, tinh thể tuyết và những chiếc quạt vàng.',
    light: ['#0e7490', '#1d4ed8', '#a16207'],
    dark: ['#67e8f9', '#93c5fd', '#fde68a'],
  },
  {
    slug: 'muzan',
    name: 'Muzan',
    theme: 'dragon',
    description:
      'Muzan Kibutsuji với vương miện gai, hào quang đỏ thẫm, hoa bỉ ngạn và chiếc mũ trắng.',
    light: ['#b91c1c', '#9f1239', '#c02631'],
    dark: ['#f87171', '#fb7185', '#fecdd3'],
  },
  {
    slug: 'sanemi',
    name: 'Sanemi',
    theme: 'mist',
    description:
      'Phong Trụ Sanemi Shinazugawa giữa những luồng gió xanh bạc hà, lốc xoáy và kiếm Nichirin.',
    light: ['#047857', '#0f766e', '#15803d'],
    dark: ['#6ee7b7', '#5eead4', '#d1fae5'],
  },
  {
    slug: 'obanai',
    name: 'Obanai',
    theme: 'moon',
    description:
      'Xà Trụ Obanai Iguro cùng rắn Kaburamaru, kiếm uốn lượn và vòng khung tím xanh sọc trắng đen.',
    light: ['#7e22ce', '#047857', '#6d28d9'],
    dark: ['#c084fc', '#6ee7b7', '#ede9fe'],
  },
  {
    slug: 'rengoku',
    name: 'Rengoku',
    theme: 'fire',
    description:
      'Viêm Trụ Kyojuro Rengoku với thanh kiếm rực lửa, áo choàng trắng và vòng hào quang đỏ vàng.',
    light: ['#c2410c', '#b91c1c', '#b45309'],
    dark: ['#fb923c', '#f87171', '#fde68a'],
  },
  {
    slug: 'mitsuri',
    name: 'Mitsuri',
    theme: 'manga',
    description:
      'Luyến Trụ Mitsuri Kanroji giữa trái tim, hoa anh đào và những dải sáng hồng xanh dịu dàng.',
    light: ['#be185d', '#4d7c0f', '#c026d3'],
    dark: ['#f9a8d4', '#bef264', '#fce7f3'],
  },
  {
    slug: 'gyomei',
    name: 'Gyomei',
    theme: 'builder',
    description:
      'Nham Trụ Gyomei Himejima với vòng đá vàng, chuỗi hạt, rìu và chùy gai nối bằng dây xích.',
    light: ['#92400e', '#57534e', '#a16207'],
    dark: ['#fbbf24', '#d6d3d1', '#fef3c7'],
  },
  {
    slug: 'akaza',
    name: 'Akaza',
    theme: 'water',
    description:
      'Thượng Huyền Tam Akaza giữa năng lượng xanh hồng, hoa tuyết la bàn và những vệt quyền lực.',
    light: ['#be185d', '#0369a1', '#7e22ce'],
    dark: ['#f472b6', '#38bdf8', '#e0f2fe'],
  },
  {
    slug: 'kokushibo',
    name: 'Kokushibo',
    theme: 'moon',
    description:
      'Thượng Huyền Nhất Kokushibo với sáu mắt, kiếm quỷ, trăng lưỡi liềm và hào quang tím đỏ.',
    light: ['#7e22ce', '#6b21a8', '#c2410c'],
    dark: ['#c084fc', '#a78bfa', '#fdba74'],
  },
  {
    slug: 'tanjiro',
    name: 'Tanjiro',
    theme: 'fire',
    description:
      'Tanjiro Kamado với họa tiết caro xanh đen, hoa tai Hanafuda và vòng lửa đỏ cam rực sáng.',
    light: ['#15803d', '#b91c1c', '#b45309'],
    dark: ['#4ade80', '#fb923c', '#fde68a'],
  },
] as const

export const DEMON_SLAYER_FRAMES: ShopItem[] = characters.map((character) => ({
  id: `frame-${character.slug}`,
  name: `${character.name} - Premium`,
  description: character.description,
  category: 'frame',
  theme: character.theme,
  collection: 'demon-slayer',
  premium: true,
  artwork: `cosmetics/demon-slayer/${character.slug}-frame.png`,
  namePalette: { light: character.light, dark: character.dark },
  tier: 3,
  price: 4000,
  streakRequired: 40,
  extraRequired: 0,
}))
