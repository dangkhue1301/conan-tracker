export type CosmeticCategory = 'frame' | 'banner' | 'title' | 'celebration' | 'pet' | 'weapon'
export interface ShopItem {
  id: string
  name: string
  description: string
  category: CosmeticCategory
  theme: string
  collection?: 'demon-slayer'
  premium?: boolean
  artwork?: string
  namePalette?: {
    light: readonly [string, string, string]
    dark: readonly [string, string, string]
  }
  tier: number
  price: number
  streakRequired: number
  extraRequired: number
}
export interface StreakRepair {
  id: string
  date: string
  reason: string
  prevention: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
export interface MonthlyPrize {
  id: string
  title: string
  description: string
  active: boolean
}
export interface PrizeRequest {
  id: string
  month: string
  title: string
  status: 'pending' | 'approved' | 'delivered' | 'rejected'
  createdAt: string
}
export interface LeagueResult {
  week: string
  tier: number
  rank: number
  xp: number
  result: 'promoted' | 'stayed' | 'demoted'
}
export interface GameState {
  avatarPath: string | null
  inventory: string[]
  equipped: Partial<Record<CosmeticCategory, string>>
  spentCoins: number
  repairs: StreakRepair[]
  prizeCatalog: MonthlyPrize[]
  prizeRequests: PrizeRequest[]
  seenMilestones: string[]
  readMessageIds: string[]
  league: { tier: number; joinedWeek: string | null; history: LeagueResult[] }
}
export type GameAction =
  | { type: 'buy'; itemId: string }
  | { type: 'equip'; category: CosmeticCategory; itemId: string | null }
  | { type: 'avatar'; path: string | null }
  | { type: 'seen'; keys: string[] }
  | { type: 'read'; ids: string[] }
  | { type: 'repair-request'; date: string; reason: string; prevention: string }
  | { type: 'repair-review'; id: string; approve: boolean }
  | { type: 'prize-save'; prize: MonthlyPrize }
  | { type: 'prize-request'; month: string; title: string }
  | { type: 'prize-review'; id: string; status: 'approved' | 'delivered' | 'rejected' }
  | { type: 'league-join' }
