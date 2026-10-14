import type { GameAction, GameState } from './gamification-types'

export type Role = 'learner' | 'mentor' | 'parent'
export type HabitId = 'anki' | 'grammar' | 'mental' | 'review' | 'reading' | 'writing' | 'tidy'
export type CheckinStatus = 'not_started' | 'minimum' | 'done' | 'extra'
export type AvatarId = 'detective' | 'football' | 'builder'
export type Accent = 'teal' | 'blue' | 'violet' | 'orange'
export type Autonomy = 'less_reminding' | 'same' | 'more_reminding'

export interface Actor {
  id: string
  name: string
  email: string
  role: Role
}
export interface Profile {
  name: string
  startedOn: string
  avatar: AvatarId
  accent: Accent
  familyPhoto: string | null
}
export interface DaySchedule {
  time: string
  subject: string
}
export interface Habit {
  id: HabitId
  title: string
  minimum: number | null
  target: number
  unit: string
  url: string
  period: 'morning' | 'review' | 'evening'
  schedule: Record<string, DaySchedule>
}
export interface Plan {
  id: string
  revision: number
  effectiveFrom: string
  phase: 1 | 2 | 3
  habits: Habit[]
}
export type SavePlanInput =
  | { mode: 'create'; effectiveFrom: string; habits: Habit[] }
  | { mode: 'edit'; id: string; expectedRevision: number; habits: Habit[] }
export interface Checkin {
  date: string
  habitId: HabitId
  status: CheckinStatus
  note: string
  planId: string
  version: number
  updatedAt: string
  updatedBy: string
}
export interface ExcusedDay {
  date: string
  reason: string
}
export interface WeeklyReview {
  weekStart: string
  praise: string
  adjustment: string
  autonomy: Autonomy
}
export interface Encouragement {
  id: string
  authorId: string
  authorName: string
  body: string
  imagePath: string | null
  createdAt: string
}
export interface Milestone {
  id: string
  title: string
  date: string
  achieved: boolean
}
export interface Goal {
  id: string
  title: string
  description: string
  imagePath: string | null
  milestones: Milestone[]
}
export interface Reward {
  id: string
  title: string
  conditions: string
  imagePath: string | null
  visible: boolean
  received: boolean
}
export interface Snapshot {
  game?: GameState
  actor: Actor
  profile: Profile | null
  plans: Plan[]
  checkins: Checkin[]
  excuses: ExcusedDay[]
  reviews: WeeklyReview[]
  messages: Encouragement[]
  goals: Goal[]
  rewards: Reward[]
}
export interface CheckinInput {
  date: string
  habitId: HabitId
  status: CheckinStatus
  note: string
  expectedVersion: number
}
export interface Repository {
  mode: 'demo' | 'cloud'
  load(): Promise<Snapshot>
  watch(callback: () => void): () => void
  saveCheckin(input: CheckinInput): Promise<void>
  initialize(profile: Profile, habits: Habit[]): Promise<void>
  savePlan(plan: SavePlanInput): Promise<void>
  savePreferences(avatar: AvatarId, accent: Accent): Promise<void>
  saveProfile(name: string, familyPhoto: string | null): Promise<void>
  saveExcuse(date: string, reason: string, remove?: boolean): Promise<void>
  saveReview(review: WeeklyReview): Promise<void>
  saveMessage(body: string, imagePath: string | null): Promise<void>
  deleteMessage(id: string): Promise<void>
  saveGoal(goal: Goal): Promise<void>
  deleteGoal(id: string): Promise<void>
  saveReward(reward: Reward): Promise<void>
  upload(file: File): Promise<string>
  assetUrl(path: string): Promise<string>
  gameAction(action: GameAction): Promise<void>
  uploadAvatar(file: File): Promise<string>
  avatarUrl(path: string): Promise<string>
}
