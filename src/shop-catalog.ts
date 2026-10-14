import type { CosmeticCategory, ShopItem } from './gamification-types'

export const CATEGORY_LABELS: Record<Exclude<CosmeticCategory, 'weapon'>, string> = {
  frame: 'Khung avatar',
  banner: 'Ảnh bìa',
  title: 'Danh hiệu',
  celebration: 'Hiệu ứng ăn mừng',
  pet: 'Bạn đồng hành',
}

export const COLLECTION_LABELS: Record<NonNullable<ShopItem['collection']>, string> = {
  'demon-slayer': 'Demon Slayer',
}

const themes = [
  ['flame', 'Ngọn lửa'],
  ['football', 'Sân cỏ'],
  ['detective', 'Thám tử'],
  ['manga', 'Manga'],
  ['builder', 'Thế giới khối'],
  ['space', 'Ngân hà'],
] as const
const tierNames = ['Khởi đầu', 'Chiến binh', 'Anh hùng', 'Huyền thoại', 'Thần thoại']
const framePrices = [100, 500, 1800, 4000, 8500]
const frameStreaks = [0, 10, 30, 60, 100]

const starter: ShopItem = {
  id: 'frame-starter',
  name: 'Hành trình bắt đầu',
  description: 'Khung đầu tiên dành cho hành trình duy trì thói quen của em.',
  category: 'frame',
  theme: 'detective',
  tier: 0,
  price: 0,
  streakRequired: 0,
  extraRequired: 0,
}

export const SHOP_ITEMS: ShopItem[] = [
  starter,
  {
    id: 'frame-mist-swordsman',
    name: 'Muichiro - Premium',
    description:
      'Vòng kiếm bạc, mây và lửa ngọc bích, cùng kiếm sĩ nhỏ ở chân khung. Thiết kế theo ảnh em yêu thích.',
    category: 'frame',
    theme: 'mist',
    collection: 'demon-slayer',
    tier: 3,
    price: 4000,
    streakRequired: 40,
    extraRequired: 0,
  },
  ...themes.flatMap(([theme, name]) =>
    framePrices.map((price, tier): ShopItem => ({
      id: `frame-${theme}-${tier + 1}`,
      name: `${name} · ${tierNames[tier]}`,
      description: `Khung ${name.toLowerCase()} cấp ${tier + 1}, họa tiết và đường viền riêng quanh avatar.`,
      category: 'frame',
      theme,
      tier,
      price,
      streakRequired: frameStreaks[tier],
      extraRequired: tier === 4 ? 50 : 0,
    })),
  ),
  ...themes.flatMap(([theme, name]) =>
    [150, 900].map((price, tier): ShopItem => ({
      id: `banner-${theme}-${tier + 1}`,
      name: `${name} · ${tier ? 'Rực rỡ' : 'Ảnh bìa'}`,
      description: `Tạo không gian ${name.toLowerCase()} cho hồ sơ của em.`,
      category: 'banner',
      theme,
      tier,
      price,
      streakRequired: tier ? 14 : 0,
      extraRequired: 0,
    })),
  ),
  ...themes.flatMap(([theme, name]) =>
    [100, 600].map((price, tier): ShopItem => ({
      id: `title-${theme}-${tier + 1}`,
      name: `${tier ? 'Bậc thầy' : 'Tân binh'} ${name.toLowerCase()}`,
      description: `Danh hiệu ${name.toLowerCase()} hiển thị bên cạnh tên của em.`,
      category: 'title',
      theme,
      tier,
      price,
      streakRequired: tier ? 7 : 0,
      extraRequired: 0,
    })),
  ),
  ...themes.map(([theme], i): ShopItem => ({
    id: `celebration-${theme}`,
    name: [
      'Lửa bền bỉ',
      'Chớp vàng bứt phá',
      'Kim cương băng lam',
      'Vương miện hoàng gia',
      'Tinh thể lục bảo',
      'Sao băng hồng ngọc',
    ][i],
    description: [
      'Ngọn lửa cam rực và pháo hoa ấm, mừng từng ngày em bền bỉ.',
      'Tia chớp vàng điện, những đường sáng sắc nét và pháo hoa bứt phá.',
      'Kim cương xanh băng nhiều mặt cắt, hạt sáng trong veo và pháo hoa lam.',
      'Vương miện tím hoàng gia, những tia sáng vinh danh thành tựu của em.',
      'Tinh thể lục bảo xanh ngọc, hào quang hình học và hạt sáng rực rỡ.',
      'Sao băng hồng rực với đuôi sáng và những chùm pháo hoa giữa ngân hà.',
    ][i],
    category: 'celebration',
    theme,
    tier: i < 3 ? 0 : 1,
    price: i < 3 ? 300 : 1500,
    streakRequired: i < 3 ? 0 : 30,
    extraRequired: 0,
  })),
  ...[
    ['cat', 'Mèo thám tử'],
    ['robot', 'Robot khối vuông'],
    ['fox', 'Cáo tinh anh'],
    ['wolf', 'Sói ánh trăng'],
    ['phoenix', 'Phượng hoàng lửa'],
    ['dragon', 'Rồng ngân hà'],
  ].map(([theme, name], i): ShopItem => {
    const tier = Math.floor(i / 2)
    return {
      id: `pet-${theme}`,
      name,
      description: 'Người bạn nhỏ chuyển động bên cạnh avatar, cùng em đi qua mỗi cột mốc.',
      category: 'pet',
      theme,
      tier,
      price: [500, 1500, 3500][tier],
      streakRequired: [0, 10, 30][tier],
      extraRequired: 0,
    }
  }),
]

const itemsById = new Map(SHOP_ITEMS.map((item) => [item.id, item]))
export function itemById(id?: string): ShopItem | undefined {
  return id ? itemsById.get(id) : undefined
}
