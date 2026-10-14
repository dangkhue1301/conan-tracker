import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  activeHabits,
  addDays,
  canEdit,
  hasMinimum,
  planForDate,
  today,
  validateHabits,
  weekStart,
} from './domain'
import { defaultHabits, defaultProfile, withTidyHabit } from './defaults'
import {
  emptyGameState,
  gameState,
  gameStats,
  leagueBotFinalXp,
  monthlyProgress,
} from './gamification'
import { itemById } from './shop-catalog'
import type { GameAction } from './gamification-types'
import type {
  Actor,
  Accent,
  AvatarId,
  CheckinInput,
  Goal,
  Habit,
  Plan,
  Profile,
  Repository,
  Reward,
  Role,
  Snapshot,
  SavePlanInput,
  WeeklyReview,
} from './types'

const DEMO_KEY = 'conan-tracker-demo-v1'
const id = () => crypto.randomUUID()
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
export const isConfigured = !!supabaseUrl && !!supabaseKey
export const client = isConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { flowType: 'pkce', detectSessionInUrl: true },
    })
  : null

export function demoSnapshot(role: Role = 'learner', date = today()): Snapshot {
  const startedOn = addDays(weekStart(date), -21)
  const habits = defaultHabits().filter((h) => h.id !== 'tidy')
  const plans: Plan[] = [
    { id: 'demo-plan-1', effectiveFrom: startedOn, phase: 1, revision: 1, habits },
    {
      id: 'demo-plan-2',
      effectiveFrom: addDays(startedOn, 7),
      phase: 2,
      revision: 1,
      habits: structuredClone(habits),
    },
    {
      id: 'demo-plan-3',
      effectiveFrom: addDays(startedOn, 14),
      phase: 3,
      revision: 1,
      habits: structuredClone(habits),
    },
  ]
  // All sample history is confined to the explicitly labelled demo; it is never sent to Supabase.
  const checkins: Snapshot['checkins'] = []
  for (let offset = 0; addDays(startedOn, offset) < date; offset++) {
    const d = addDays(startedOn, offset),
      plan = planForDate(plans, d)!
    for (const [index, habit] of activeHabits(plan).entries()) {
      if ((offset + index * 3) % 9 === 0) continue
      const status =
        (offset + index) % 7 === 0
          ? 'extra'
          : hasMinimum(habit) && (offset + index) % 5 === 0
            ? 'minimum'
            : 'done'
      checkins.push({
        date: d,
        habitId: habit.id,
        status,
        note:
          habit.id === 'review' ? 'Ví dụ: sửa bài sai về phân số, giải thích lại cách làm.' : '',
        planId: plan.id,
        version: 1,
        updatedAt: `${d}T14:00:00Z`,
        updatedBy: 'demo-learner',
      })
    }
  }
  plans.push({
    id: 'demo-plan-tidy',
    effectiveFrom: date,
    phase: 3,
    revision: 1,
    habits: withTidyHabit(habits),
  })
  return {
    actor: demoActor(role),
    profile: { ...defaultProfile(), startedOn },
    plans,
    checkins,
    excuses: [],
    reviews: [
      {
        weekStart: addDays(weekStart(date), -7),
        praise: 'Ví dụ: em đã quay lại đọc sách sau một ngày quên.',
        adjustment: 'Ví dụ: đặt sẵn cuốn sách trên bàn trước buổi tối.',
        autonomy: 'less_reminding',
      },
    ],
    messages: [],
    game: emptyGameState(),
    rewards: [],
    goals: [
      {
        id: 'demo-goal',
        title: 'Tự nhớ mở góc học tập',
        description:
          'Mục tiêu minh hoạ. Khi dùng thật, Conan và người hướng dẫn sẽ cùng chọn điều em muốn làm được.',
        imagePath: null,
        milestones: [
          {
            id: 'demo-m1',
            title: 'Cùng chọn một giờ mở checklist',
            date: addDays(date, 7),
            achieved: false,
          },
          {
            id: 'demo-m2',
            title: 'Nhìn lại những lần em đã tự bắt đầu',
            date: addDays(date, 30),
            achieved: false,
          },
        ],
      },
    ],
  }
}
export function demoActor(role: Role): Actor {
  return {
    id: `demo-${role}`,
    email: `${role}@demo.invalid`,
    role,
    name: role === 'learner' ? 'Conan' : role === 'mentor' ? 'Người hướng dẫn' : 'Ba mẹ',
  }
}

export class DemoRepository implements Repository {
  mode = 'demo' as const
  private listeners = new Set<() => void>()
  constructor(
    private role: Role,
    private storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
    private clock = today,
  ) {}
  private data(): Snapshot {
    const raw = this.storage.getItem(DEMO_KEY)
    const value = raw ? (JSON.parse(raw) as Snapshot) : demoSnapshot(this.role, this.clock())
    for (const plan of value.plans) plan.revision ??= 1
    if (raw && value.profile) {
      const date = this.clock(),
        current = planForDate(value.plans, date)
      let changed = false
      if (current && (current.phase !== 3 || !current.habits.some((h) => h.id === 'tidy'))) {
        if (current.effectiveFrom === date) {
          current.phase = 3
          current.habits = withTidyHabit(current.habits)
          current.revision++
        } else
          value.plans.push({
            ...structuredClone(current),
            id: id(),
            effectiveFrom: date,
            phase: 3,
            revision: 1,
            habits: withTidyHabit(current.habits),
          })
        changed = true
      }
      for (const plan of value.plans)
        if (
          plan.effectiveFrom > date &&
          (plan.phase !== 3 || !plan.habits.some((h) => h.id === 'tidy'))
        ) {
          plan.phase = 3
          plan.habits = withTidyHabit(plan.habits)
          plan.revision++
          changed = true
        }
      if (changed) this.storage.setItem(DEMO_KEY, JSON.stringify(value))
    }
    value.actor = demoActor(this.role)
    value.game = gameState(value)
    const receipt = this.storage.getItem(`${DEMO_KEY}-receipts-${this.role}`)
    value.game.seenMilestones = receipt ? (JSON.parse(receipt).seenMilestones ?? []) : []
    value.game.readMessageIds = receipt ? (JSON.parse(receipt).readMessageIds ?? []) : []
    return value
  }
  private write(data: Snapshot) {
    this.storage.setItem(DEMO_KEY, JSON.stringify(data))
    this.listeners.forEach((fn) => fn())
  }
  private mentor() {
    if (this.role !== 'mentor') throw new Error('Chỉ người hướng dẫn được thực hiện thao tác này.')
  }
  async load() {
    const source = this.data()
    const league = source.game!.league
    if (league.joinedWeek && league.joinedWeek < weekStart(this.clock())) {
      const week = league.joinedWeek
      const xp = gameStats(source, addDays(week, 6)).weeklyXp
      const rank =
        1 +
        Array.from({ length: 29 }, (_, i) => leagueBotFinalXp(week, league.tier, i)).filter(
          (v) => v >= xp,
        ).length
      const slots = [20, 15, 10, 7, 7, 7, 7, 7, 5, 0][league.tier]
      const result =
        xp === 0
          ? 'stayed'
          : rank <= slots
            ? 'promoted'
            : rank >= 26 && league.tier > 0
              ? 'demoted'
              : 'stayed'
      if (!league.history.some((r) => r.week === week)) {
        league.history.push({ week, tier: league.tier, rank, xp, result })
        league.tier = Math.max(
          0,
          Math.min(9, league.tier + (result === 'promoted' ? 1 : result === 'demoted' ? -1 : 0)),
        )
      }
      league.joinedWeek = null
      this.write(source)
    }
    const value = structuredClone(source)
    if (this.role !== 'mentor') value.rewards = value.rewards.filter((r) => r.visible)
    return value
  }
  watch(callback: () => void) {
    this.listeners.add(callback)
    const changed = (event: StorageEvent) => {
      if (event.key === DEMO_KEY) callback()
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', changed)
    return () => {
      this.listeners.delete(callback)
      if (typeof window !== 'undefined') window.removeEventListener('storage', changed)
    }
  }
  async saveCheckin(input: CheckinInput) {
    const data = this.data(),
      date = this.clock()
    if (
      !data.profile ||
      !canEdit(this.role, input.date, date) ||
      input.date < data.profile.startedOn
    )
      throw new Error('Bạn không có quyền sửa ngày này.')
    if (data.excuses.some((e) => e.date === input.date))
      throw new Error('Ngày này đang được cho nghỉ.')
    const plan = planForDate(data.plans, input.date),
      habit = activeHabits(plan).find((h) => h.id === input.habitId)
    if (!habit) throw new Error('Thói quen chưa được bật trong ngày này.')
    if (input.status === 'minimum' && !hasMinimum(habit))
      throw new Error('Việc này chỉ có mức làm đủ và làm thêm.')
    if (input.habitId === 'review' && input.status !== 'not_started' && !input.note.trim())
      throw new Error('Hãy ghi một dòng về nội dung đã ôn.')
    const current = data.checkins.find((c) => c.date === input.date && c.habitId === input.habitId)
    if ((current?.version ?? 0) !== input.expectedVersion)
      throw new Error('Dữ liệu vừa được cập nhật ở nơi khác. Hãy xem lại rồi lưu lại.')
    const value = {
      date: input.date,
      habitId: input.habitId,
      status: input.status,
      note: input.note.trim(),
      planId: plan!.id,
      version: input.expectedVersion + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: data.actor.id,
    }
    data.checkins = [
      ...data.checkins.filter((c) => c.date !== input.date || c.habitId !== input.habitId),
      value,
    ]
    this.write(data)
  }
  async initialize(profile: Profile, habits: Habit[]) {
    this.mentor()
    const error = validateHabits(habits)
    if (error) throw new Error(error)
    const data = this.data()
    if (data.profile) throw new Error('Góc học tập đã được thiết lập.')
    data.profile = profile
    data.plans = [{ id: id(), effectiveFrom: profile.startedOn, phase: 3, revision: 1, habits }]
    this.write(data)
  }
  async savePlan(input: SavePlanInput) {
    this.mentor()
    const error = validateHabits(input.habits)
    if (error) throw new Error(error)
    const data = this.data()
    if (input.mode === 'create') {
      if (input.effectiveFrom <= this.clock())
        throw new Error('Kế hoạch mới cần áp dụng từ ngày mai trở đi.')
      if (data.plans.some((p) => p.effectiveFrom === input.effectiveFrom))
        throw new Error('Ngày này đã có lịch. Chọn sửa lịch sắp áp dụng.')
      data.plans.push({
        id: id(),
        revision: 1,
        effectiveFrom: input.effectiveFrom,
        phase: 3,
        habits: input.habits,
      })
    } else {
      const plan = data.plans.find((p) => p.id === input.id)
      if (!plan || plan.effectiveFrom <= this.clock())
        throw new Error('Chỉ sửa được lịch chưa có hiệu lực.')
      if (plan.revision !== input.expectedRevision)
        throw new Error('Lịch vừa được sửa ở nơi khác. Hãy xem lại trước khi lưu.')
      Object.assign(plan, { habits: input.habits, phase: 3, revision: plan.revision + 1 })
    }
    this.write(data)
  }
  async savePreferences(avatar: AvatarId, accent: Accent) {
    if (this.role === 'parent')
      throw new Error('Conan hoặc người hướng dẫn có thể đổi góc học tập.')
    const data = this.data()
    if (data.profile) data.profile = { ...data.profile, avatar, accent }
    this.write(data)
  }
  async saveProfile(name: string, familyPhoto: string | null) {
    this.mentor()
    const data = this.data()
    if (data.profile) data.profile = { ...data.profile, name: name.trim(), familyPhoto }
    this.write(data)
  }
  async saveExcuse(date: string, reason: string, remove = false) {
    this.mentor()
    const data = this.data()
    data.excuses = data.excuses.filter((e) => e.date !== date)
    if (!remove) data.excuses.push({ date, reason: reason.trim() })
    this.write(data)
  }
  async saveReview(review: WeeklyReview) {
    this.mentor()
    const data = this.data()
    data.reviews = [...data.reviews.filter((r) => r.weekStart !== review.weekStart), review]
    this.write(data)
  }
  async saveMessage(body: string, imagePath: string | null) {
    if (this.role === 'learner') throw new Error('Lời nhắn được gửi từ người lớn.')
    if (!body.trim() || body.length > 1000) throw new Error('Lời nhắn cần từ 1 đến 1000 ký tự.')
    const data = this.data()
    data.messages.unshift({
      id: id(),
      authorId: data.actor.id,
      authorName: data.actor.name,
      body: body.trim(),
      imagePath,
      createdAt: new Date().toISOString(),
    })
    this.write(data)
  }
  async deleteMessage(messageId: string) {
    const data = this.data(),
      message = data.messages.find((m) => m.id === messageId)
    if (this.role !== 'mentor' && message?.authorId !== data.actor.id)
      throw new Error('Bạn chỉ được xoá lời nhắn của mình.')
    data.messages = data.messages.filter((m) => m.id !== messageId)
    this.write(data)
  }
  async saveGoal(goal: Goal) {
    this.mentor()
    const data = this.data()
    if (!data.goals.some((g) => g.id === goal.id) && data.goals.length >= 2)
      throw new Error('Giữ tối đa hai mục tiêu để dễ tập trung.')
    data.goals = [...data.goals.filter((g) => g.id !== goal.id), goal]
    this.write(data)
  }
  async deleteGoal(goalId: string) {
    this.mentor()
    const data = this.data()
    data.goals = data.goals.filter((g) => g.id !== goalId)
    this.write(data)
  }
  async saveReward(reward: Reward) {
    this.mentor()
    const data = this.data()
    data.rewards = [reward]
    this.write(data)
  }
  async upload(file: File) {
    if (this.role === 'learner') throw new Error('Người lớn quản lý ảnh gia đình.')
    validateImage(file)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  async assetUrl(path: string) {
    return path
  }
  async gameAction(action: GameAction) {
    const data = this.data(),
      game = data.game!,
      date = this.clock()
    const owner = () => {
      if (this.role === 'parent')
        throw new Error('Conan hoặc người hướng dẫn thực hiện thao tác này.')
    }
    const adult = () => {
      if (this.role === 'learner') throw new Error('Ba mẹ hoặc người hướng dẫn duyệt quà tháng.')
    }
    switch (action.type) {
      case 'buy': {
        owner()
        const item = itemById(action.itemId),
          stats = gameStats(data, date)
        if (!item) throw new Error('Vật phẩm không tồn tại.')
        if (game.inventory.includes(item.id)) return
        if (stats.bestStreak < item.streakRequired || stats.extraCount < item.extraRequired)
          throw new Error('Em chưa đủ điều kiện mở vật phẩm này.')
        if (stats.coins < item.price) throw new Error('Em chưa đủ Coin.')
        game.spentCoins += item.price
        game.inventory.push(item.id)
        break
      }
      case 'equip': {
        owner()
        if (
          action.itemId !== null &&
          (!game.inventory.includes(action.itemId) ||
            itemById(action.itemId)?.category !== action.category)
        )
          throw new Error('Em chưa sở hữu vật phẩm phù hợp.')
        if (action.itemId === null) delete game.equipped[action.category]
        else game.equipped[action.category] = action.itemId
        break
      }
      case 'avatar':
        owner()
        if (action.path !== null && !/^data:image\/(jpeg|png|webp);base64,/.test(action.path))
          throw new Error('Chọn ảnh đã tải lên.')
        game.avatarPath = action.path
        break
      case 'seen':
        game.seenMilestones = [...new Set([...game.seenMilestones, ...action.keys])].slice(-2000)
        break
      case 'read':
        game.readMessageIds = [
          ...new Set([
            ...game.readMessageIds,
            ...action.ids.filter((key) => data.messages.some((m) => m.id === key)),
          ]),
        ].slice(-2000)
        break
      case 'repair-request': {
        owner()
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(action.date) ||
          action.date >= date ||
          action.date < addDays(date, -7) ||
          !data.profile ||
          action.date < data.profile.startedOn
        )
          throw new Error('Chỉ xin khôi phục ngày đã qua trong 7 ngày gần nhất.')
        if (
          !action.reason.trim() ||
          !action.prevention.trim() ||
          action.reason.length > 500 ||
          action.prevention.length > 500
        )
          throw new Error('Ghi lý do và cách tránh quên, tối đa 500 ký tự mỗi mục.')
        const habits = activeHabits(planForDate(data.plans, action.date))
        if (
          !habits.length ||
          data.excuses.some((e) => e.date === action.date) ||
          habits.every((h) =>
            data.checkins.some(
              (c) => c.date === action.date && c.habitId === h.id && c.status !== 'not_started',
            ),
          )
        )
          throw new Error('Ngày này không cần khôi phục.')
        if (
          game.repairs.some(
            (r) => r.date.slice(0, 7) === action.date.slice(0, 7) && r.status !== 'rejected',
          )
        )
          throw new Error('Tháng này đã có một lượt khôi phục hoặc đang chờ duyệt.')
        game.repairs.push({
          id: id(),
          date: action.date,
          reason: action.reason.trim(),
          prevention: action.prevention.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
        break
      }
      case 'repair-review': {
        this.mentor()
        const repair = game.repairs.find((r) => r.id === action.id)
        if (!repair || repair.status !== 'pending') throw new Error('Yêu cầu không còn chờ duyệt.')
        if (
          action.approve &&
          game.repairs.some(
            (r) =>
              r.id !== repair.id &&
              r.date.slice(0, 7) === repair.date.slice(0, 7) &&
              r.status === 'approved',
          )
        )
          throw new Error('Tháng này đã dùng lượt khôi phục.')
        repair.status = action.approve ? 'approved' : 'rejected'
        break
      }
      case 'prize-save': {
        adult()
        if (
          !action.prize.id ||
          !action.prize.title.trim() ||
          action.prize.title.length > 100 ||
          action.prize.description.length > 500
        )
          throw new Error('Thông tin quà chưa hợp lệ.')
        game.prizeCatalog = [
          ...game.prizeCatalog.filter((p) => p.id !== action.prize.id),
          { ...action.prize, title: action.prize.title.trim() },
        ]
        break
      }
      case 'prize-request': {
        owner()
        if (
          !/^\d{4}-\d{2}$/.test(action.month) ||
          !monthlyProgress(data, action.month, date).eligible
        )
          throw new Error('Tháng này chưa đủ điều kiện nhận quà.')
        if (!action.title.trim() || action.title.length > 150)
          throw new Error('Tên món quà cần từ 1 đến 150 ký tự.')
        if (game.prizeRequests.some((p) => p.month === action.month && p.status !== 'rejected'))
          throw new Error('Tháng này đã có yêu cầu quà.')
        game.prizeRequests.push({
          id: id(),
          month: action.month,
          title: action.title.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
        break
      }
      case 'prize-review': {
        adult()
        const request = game.prizeRequests.find((p) => p.id === action.id)
        if (
          !request ||
          !(
            (request.status === 'pending' && ['approved', 'rejected'].includes(action.status)) ||
            (request.status === 'approved' && action.status === 'delivered')
          )
        )
          throw new Error('Trạng thái quà không hợp lệ.')
        if (action.status === 'approved' && !monthlyProgress(data, request.month, date).eligible)
          throw new Error('Tiến độ tháng đã thay đổi, chưa đủ điều kiện.')
        request.status = action.status
        break
      }
      case 'league-join':
        owner()
        if (game.league.joinedWeek && game.league.joinedWeek !== weekStart(date))
          throw new Error('Hãy tải lại để tổng kết tuần trước.')
        game.league.joinedWeek = weekStart(date)
        break
    }
    if (action.type === 'seen' || action.type === 'read')
      this.storage.setItem(
        `${DEMO_KEY}-receipts-${this.role}`,
        JSON.stringify({
          seenMilestones: game.seenMilestones,
          readMessageIds: game.readMessageIds,
        }),
      )
    this.write(data)
  }
  async uploadAvatar(file: File) {
    if (this.role === 'parent') throw new Error('Conan hoặc người hướng dẫn thay ảnh đại diện.')
    validateImage(file)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  async avatarUrl(path: string) {
    return path
  }
}

export function validateImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh cần nhỏ hơn 5 MB.')
}
export class CloudRepository implements Repository {
  mode = 'cloud' as const
  constructor(private db: SupabaseClient = client!) {}
  private async rpc(name: string, args?: Record<string, unknown>) {
    const { data, error } = await this.db.rpc(name, args)
    if (error)
      throw new Error(
        error.code === '40001' || error.code === '23505'
          ? 'Dữ liệu vừa được cập nhật ở nơi khác. Hãy xem lại rồi lưu lại.'
          : error.message,
      )
    return data
  }
  async load(): Promise<Snapshot> {
    return await this.rpc('app_snapshot')
  }
  watch(callback: () => void) {
    const channel = this.db.channel(`tracker-${id()}`)
    for (const table of [
      'profiles',
      'plan_versions',
      'checkins',
      'excused_days',
      'weekly_reviews',
      'encouragements',
      'goals',
      'rewards',
      'memberships',
      'game_state',
      'game_receipts',
    ])
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    channel.subscribe()
    return () => {
      void this.db.removeChannel(channel)
    }
  }
  async saveCheckin(input: CheckinInput) {
    await this.rpc('save_checkin', {
      p_date: input.date,
      p_habit_id: input.habitId,
      p_status: input.status,
      p_note: input.note,
      p_expected_version: input.expectedVersion,
    })
  }
  async initialize(profile: Profile, habits: Habit[]) {
    await this.rpc('initialize_tracker', { p_profile: profile, p_habits: habits })
  }
  async savePlan(input: SavePlanInput) {
    await this.rpc('save_plan_v2', {
      p_effective_from: input.mode === 'create' ? input.effectiveFrom : null,
      p_plan_id: input.mode === 'edit' ? input.id : null,
      p_expected_revision: input.mode === 'edit' ? input.expectedRevision : null,
      p_habits: input.habits,
    })
  }
  async savePreferences(avatar: AvatarId, accent: Accent) {
    await this.rpc('save_preferences', { p_avatar: avatar, p_accent: accent })
  }
  async saveProfile(name: string, familyPhoto: string | null) {
    await this.rpc('save_profile', { p_name: name, p_family_photo: familyPhoto })
  }
  async saveExcuse(date: string, reason: string, remove = false) {
    await this.rpc('save_excuse', { p_date: date, p_reason: reason, p_remove: remove })
  }
  async saveReview(review: WeeklyReview) {
    await this.rpc('save_weekly_review', { p_review: review })
  }
  async saveMessage(body: string, imagePath: string | null) {
    await this.rpc('save_encouragement', { p_body: body, p_image_path: imagePath })
  }
  async deleteMessage(messageId: string) {
    await this.rpc('delete_encouragement', { p_id: messageId })
  }
  async saveGoal(goal: Goal) {
    await this.rpc('save_goal', { p_goal: goal })
  }
  async deleteGoal(goalId: string) {
    await this.rpc('delete_goal', { p_id: goalId })
  }
  async saveReward(reward: Reward) {
    await this.rpc('save_reward', { p_reward: reward })
  }
  async upload(file: File) {
    validateImage(file)
    const { data } = await this.db.auth.getUser()
    if (!data.user) throw new Error('Hãy đăng nhập lại để thêm ảnh.')
    const extension =
      file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
    const path = `${data.user.id}/${id()}.${extension}`
    const { error } = await this.db.storage
      .from('family-assets')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error(error.message)
    return path
  }
  async assetUrl(path: string) {
    const { data, error } = await this.db.storage.from('family-assets').createSignedUrl(path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  }
  async gameAction(action: GameAction) {
    await this.rpc('game_action', { p_action: action })
  }
  async uploadAvatar(file: File) {
    validateImage(file)
    const { data } = await this.db.auth.getUser()
    if (!data.user) throw new Error('Hãy đăng nhập lại để thêm ảnh.')
    const extension =
      file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
    const path = `${data.user.id}/${id()}.${extension}`
    const { error } = await this.db.storage
      .from('avatar-assets')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error(error.message)
    return path
  }
  async avatarUrl(path: string) {
    const { data, error } = await this.db.storage.from('avatar-assets').createSignedUrl(path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  }
}
