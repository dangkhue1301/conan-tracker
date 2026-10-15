import type { ShopItem } from './gamification-types'

const characters = [
  {
    slug: 'douma',
    name: 'Douma',
    theme: 'ice',
    description:
      'Thượng Huyền Nhị Douma với quạt vàng, sen băng và những dải sương xanh nhạt quanh vòng khung đỏ.',
  },
  {
    slug: 'sanemi',
    name: 'Sanemi',
    theme: 'mist',
    description:
      'Phong Trụ Sanemi Shinazugawa cùng kiếm xanh, lá cây và những luồng gió trắng xanh quanh khung.',
  },
  {
    slug: 'obanai',
    name: 'Obanai',
    theme: 'moon',
    description:
      'Xà Trụ Obanai Iguro cùng rắn Kaburamaru, kiếm uốn lượn, mây và vòng khung sọc trắng đen.',
  },
  {
    slug: 'giyu',
    name: 'Giyu',
    theme: 'water',
    description:
      'Thủy Trụ Giyu Tomioka với sóng nước xanh, kiếm Nichirin và họa tiết haori hai màu.',
  },
  {
    slug: 'gyomei',
    name: 'Gyomei',
    theme: 'builder',
    description:
      'Nham Trụ Gyomei Himejima bên vòng đá, chuỗi hạt vàng, rìu và chùy gai nối bằng dây xích.',
  },
  {
    slug: 'tanjiro',
    name: 'Tanjiro',
    theme: 'fire',
    description:
      'Tanjiro Kamado cùng họa tiết caro xanh đen, hoa tai Hanafuda, sóng nước và những ngọn lửa nhỏ.',
  },
  {
    slug: 'muichiro',
    name: 'Muichiro',
    theme: 'mist',
    description:
      'Hà Trụ Muichiro Tokito với kiếm Nichirin, mây trắng và vòng khung xanh ngọc phủ họa tiết sương.',
  },
  {
    slug: 'kokushibo',
    name: 'Kokushibo',
    theme: 'moon',
    description:
      'Thượng Huyền Nhất Kokushibo với sáu mắt, kiếm quỷ, trăng lưỡi liềm và vòng khung tím đỏ.',
  },
  {
    slug: 'mitsuri',
    name: 'Mitsuri',
    theme: 'manga',
    description:
      'Luyến Trụ Mitsuri Kanroji bên hoa anh đào, trái tim, mây hồng và thanh kiếm mềm quanh vòng khung hồng xanh.',
  },
] as const

export const DEMON_SLAYER_BASIC_FRAMES: ShopItem[] = characters.map((character) => ({
  id: `frame-demon-slayer-basic-${character.slug}`,
  name: `${character.name} - Basic`,
  description: character.description,
  category: 'frame',
  theme: character.theme,
  collection: 'demon-slayer',
  premium: false,
  artwork: `cosmetics/demon-slayer/basic/${character.slug}-frame.png`,
  tier: 2,
  price: 1800,
  streakRequired: 14,
  extraRequired: 0,
}))
