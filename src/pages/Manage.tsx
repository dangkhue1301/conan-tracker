import { useState } from 'react'
import { Check, ChevronDown, Coffee, Settings2, ShieldCheck, Trophy } from 'lucide-react'
import { activeHabits, addDays, planForDate, shortDate, validateHabits } from '../domain'
import { withTidyHabit } from '../defaults'
import { habitTitle } from '../domain'
import type { Habit, Repository, Reward, Snapshot } from '../types'
import type { Run } from '../App'
import { Button, ImageField, SectionHeading, Modal } from '../ui'

function ManageForm({
  data,
  repo,
  run,
  busy,
  currentDate,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
  currentDate: string
}) {
  const currentPlan = planForDate(data.plans, currentDate)!
  const futurePlans = data.plans.filter((p) => p.effectiveFrom > currentDate)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [sourceId, setSourceId] = useState(currentPlan.id)
  const [habits, setHabits] = useState<Habit[]>(
    withTidyHabit(currentPlan.habits).map((h) => ({ ...h, title: habitTitle(h) })),
  )
  const [revision, setRevision] = useState(currentPlan.revision)
  const [effectiveFrom, setEffectiveFrom] = useState(addDays(currentDate, 1)),
    [formError, setFormError] = useState(''),
    [formFeedback, setFormFeedback] = useState(''),
    [confirm, setConfirm] = useState(false)
  const selectSource = (id: string, nextMode = mode) => {
    const p = data.plans.find((item) => item.id === id)
    if (!p) return
    setSourceId(p.id)
    setHabits(withTidyHabit(p.habits).map((h) => ({ ...h, title: habitTitle(h) })))
    setRevision(p.revision)
    setEffectiveFrom(nextMode === 'edit' ? p.effectiveFrom : addDays(currentDate, 1))
    setFormError('')
    setFormFeedback('')
  }
  const save = async () => {
    setConfirm(false)
    setFormError('')
    setFormFeedback('')
    const success = `Đã lưu kế hoạch áp dụng từ ${shortDate(effectiveFrom)}.`
    if (
      await run(async () => {
        try {
          await repo.savePlan(
            mode === 'create'
              ? { mode, effectiveFrom, habits }
              : { mode, id: sourceId, expectedRevision: revision, habits },
          )
        } catch (error) {
          setFormError((error as Error).message)
          throw error
        }
      }, '')
    ) {
      setFormFeedback(success)
      if (mode === 'edit') setRevision(revision + 1)
    }
  }
  const [name, setName] = useState(data.profile!.name),
    [familyPhoto, setFamilyPhoto] = useState(data.profile!.familyPhoto),
    [uploading, setUploading] = useState(false)
  const [excuseDate, setExcuseDate] = useState(currentDate),
    [reason, setReason] = useState('')
  const changeHabit = (id: string, patch: Partial<Habit>) =>
    setHabits(habits.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  return (
    <>
      <SectionHeading eyebrow="DÀNH CHO NGƯỜI HƯỚNG DẪN" title="Quản lý góc học tập">
        <span className="small-tag">
          <ShieldCheck size={14} />
          Bạn đang quản lý
        </span>
      </SectionHeading>
      <p className="page-intro">
        Điều chỉnh vừa sức sau khi cùng em nhìn lại. Kế hoạch mới được áp dụng từ ngày bạn chọn; kết
        quả đã qua giữ nguyên yêu cầu cũ.
      </p>
      <section className="card management-plan">
        <div className="card-topline">
          <div>
            <h2>Lịch và yêu cầu</h2>
            <p className="muted">Hiện tại: {activeHabits(currentPlan).length} việc mỗi ngày</p>
          </div>
          <label className="compact-label">
            {mode === 'create' ? 'Sao chép cấu hình từ' : 'Lịch sắp áp dụng'}
            <select value={sourceId} onChange={(e) => selectSource(e.target.value)}>
              {(mode === 'create' ? data.plans : futurePlans).map((p) => (
                <option value={p.id} key={p.id}>
                  {shortDate(p.effectiveFrom)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setFormFeedback('')
            const issue =
              validateHabits(habits) ??
              (mode === 'create' && data.plans.some((p) => p.effectiveFrom === effectiveFrom)
                ? 'Ngày này đã có lịch. Chọn Sửa lịch sắp áp dụng để chỉnh lịch đó.'
                : null)
            setFormError(issue ?? '')
            if (!issue) {
              if (mode === 'edit') setConfirm(true)
              else void save()
            }
          }}
        >
          <div className="plan-controls">
            <label>
              Thao tác với lịch
              <select
                value={mode}
                onChange={(e) => {
                  const next = e.target.value as 'create' | 'edit'
                  setMode(next)
                  selectSource(next === 'edit' ? futurePlans[0].id : currentPlan.id, next)
                }}
              >
                <option value="create">Sao chép thành lịch mới</option>
                <option value="edit" disabled={!futurePlans.length}>
                  Sửa lịch sắp áp dụng
                </option>
              </select>
            </label>
            <label>
              Áp dụng từ ngày
              <input
                type="date"
                min={addDays(currentDate, 1)}
                required
                readOnly={mode === 'edit'}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </label>
          </div>
          <div className="habit-edit-list">
            {habits.map((h) => (
              <details key={h.id} className="habit-edit">
                <summary>
                  <div>
                    <strong>{h.title}</strong>
                    <span>
                      {h.minimum && h.minimum < h.target
                        ? `Ít nhất ${h.minimum} · đủ ${h.target} ${h.unit}`
                        : `Đủ ${h.target} ${h.unit}`}
                    </span>
                  </div>
                  <ChevronDown size={17} />
                </summary>
                <div className="habit-edit-body">
                  <div className="form-grid three">
                    <label>
                      Tên việc
                      <input
                        required
                        maxLength={100}
                        value={h.title}
                        onChange={(e) => changeHabit(h.id, { title: e.target.value })}
                      />
                    </label>
                    <label>
                      Làm ít nhất
                      <input
                        type="number"
                        min={1}
                        max={h.target}
                        placeholder="Không tách mức"
                        value={h.minimum ?? ''}
                        onChange={(e) =>
                          changeHabit(h.id, {
                            minimum: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </label>
                    <label>
                      Làm đủ
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        required
                        value={h.target}
                        onChange={(e) => changeHabit(h.id, { target: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="form-grid two">
                    <label>
                      Đơn vị
                      <select
                        value={h.unit}
                        onChange={(e) => changeHabit(h.id, { unit: e.target.value })}
                      >
                        <option>phút</option>
                        <option>câu</option>
                        <option>trang</option>
                      </select>
                    </label>
                    <label>
                      Buổi hiển thị
                      <select
                        value={h.period}
                        onChange={(e) =>
                          changeHabit(h.id, { period: e.target.value as Habit['period'] })
                        }
                      >
                        <option value="morning">Buổi sáng</option>
                        <option value="review">Ôn bài</option>
                        <option value="evening">Đọc và viết</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    URL website học
                    <input
                      type="url"
                      value={h.url}
                      placeholder="https://… (có thể thêm sau)"
                      maxLength={2048}
                      onChange={(e) => changeHabit(h.id, { url: e.target.value })}
                    />
                  </label>
                  <div className="schedule-editor">
                    <div className="schedule-labels">
                      <span>Thứ</span>
                      <span>Giờ gợi ý</span>
                      <span>{h.id === 'review' ? 'Môn / nội dung ôn' : 'Gợi ý thêm'}</span>
                    </div>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = String(i + 1),
                        s = h.schedule[d]
                      return (
                        <div key={d}>
                          <span>{i === 6 ? 'CN' : `T${i + 2}`}</span>
                          <input
                            type="time"
                            aria-label={`${h.title}, ${i === 6 ? 'Chủ nhật' : `thứ ${i + 2}`}, giờ`}
                            value={s.time}
                            onChange={(e) =>
                              changeHabit(h.id, {
                                schedule: { ...h.schedule, [d]: { ...s, time: e.target.value } },
                              })
                            }
                          />
                          <input
                            aria-label={`${h.title}, ${i === 6 ? 'Chủ nhật' : `thứ ${i + 2}`}, nội dung`}
                            maxLength={100}
                            value={s.subject}
                            placeholder={i > 4 ? 'Linh hoạt' : 'Không bắt buộc'}
                            onChange={(e) =>
                              changeHabit(h.id, {
                                schedule: { ...h.schedule, [d]: { ...s, subject: e.target.value } },
                              })
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                  <p className="muted">
                    Để trống giờ khi học linh hoạt. Để trống mức ít nhất nếu việc chỉ có một mốc
                    hoàn thành.
                  </p>
                </div>
              </details>
            ))}
          </div>
          {formError && (
            <p className="field-error" role="alert">
              {formError}
            </p>
          )}
          {formFeedback && (
            <p className="form-feedback" role="status">
              {formFeedback}
            </p>
          )}
          <div className="form-actions">
            <p className="muted">URL mới cũng áp dụng cùng phiên bản kế hoạch.</p>
            <Button type="submit" busy={busy}>
              <Check size={16} />
              {mode === 'create' ? 'Lưu kế hoạch' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </section>
      {confirm && (
        <Modal title="Lưu thay đổi lịch sắp áp dụng?" onClose={() => setConfirm(false)}>
          <p>
            Cập nhật {habits.length} việc của lịch ngày {shortDate(effectiveFrom)}. Các ngày đã qua
            giữ nguyên.
          </p>
          <div className="modal-actions">
            <Button className="secondary" onClick={() => setConfirm(false)}>
              Xem lại
            </Button>
            <Button busy={busy} onClick={() => void save()}>
              Lưu thay đổi
            </Button>
          </div>
        </Modal>
      )}
      <div className="management-grid">
        <section className="card">
          <div className="aside-heading">
            <Coffee size={20} />
            <h2>Ngày được nghỉ</h2>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (await run(() => repo.saveExcuse(excuseDate, reason), 'Đã ghi nhận ngày nghỉ.'))
                setReason('')
            }}
          >
            <label>
              Ngày
              <input
                required
                type="date"
                min={data.profile!.startedOn}
                value={excuseDate}
                onChange={(e) => setExcuseDate(e.target.value)}
              />
            </label>
            <label>
              Lý do ngắn
              <input
                required
                maxLength={300}
                value={reason}
                placeholder="Ví dụ: gia đình đi xa"
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button className="secondary" type="submit" busy={busy}>
              Cho nghỉ ngày này
            </Button>
          </form>
          <div className="excuse-list">
            {[...data.excuses]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => (
                <div key={e.date}>
                  <div>
                    <strong>{shortDate(e.date)}</strong>
                    <p>{e.reason}</p>
                  </div>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => repo.saveExcuse(e.date, '', true), 'Đã bỏ ngày nghỉ.')
                    }
                  >
                    Bỏ nghỉ
                  </button>
                </div>
              ))}
          </div>
          <p className="muted">
            Ngày được nghỉ không làm giảm tỷ lệ duy trì. Ghi nhận cũ của ngày đó vẫn được giữ.
          </p>
        </section>
        <section className="card">
          <div className="aside-heading">
            <Settings2 size={20} />
            <h2>Tên gọi và ảnh gia đình</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void run(() => repo.saveProfile(name, familyPhoto), 'Đã cập nhật góc học tập.')
            }}
          >
            <label>
              Tên gọi
              <input
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <ImageField
              path={familyPhoto}
              setPath={setFamilyPhoto}
              repo={repo}
              label="Ảnh gia đình cổ vũ em"
              busy={busy}
              onUploadState={setUploading}
            />
            <Button type="submit" busy={busy} disabled={uploading}>
              Lưu thông tin
            </Button>
          </form>
        </section>
      </div>
      <RewardEditor
        key={data.rewards[0]?.id ?? 'empty'}
        reward={data.rewards[0]}
        repo={repo}
        run={run}
        busy={busy}
      />
    </>
  )
}
function RewardEditor({
  reward,
  repo,
  run,
  busy,
}: {
  reward?: Reward
  repo: Repository
  run: Run
  busy: boolean
}) {
  const [value, setValue] = useState<Reward>(
      reward ?? {
        id: crypto.randomUUID(),
        title: '',
        conditions: '',
        imagePath: null,
        visible: false,
        received: false,
      },
    ),
    [uploading, setUploading] = useState(false)
  return (
    <details className="card reward-editor">
      <summary>
        <div className="aside-heading">
          <Trophy size={20} />
          <div>
            <h2>Phần thưởng cả nhà sẽ cùng chốt</h2>
            <p className="muted">{value.visible ? 'Đang hiện với Conan' : 'Đang ẩn với Conan'}</p>
          </div>
        </div>
        <ChevronDown size={19} />
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void run(() => repo.saveReward(value), 'Đã lưu phần thưởng.')
        }}
      >
        <label>
          Điều đang chờ em
          <input
            maxLength={100}
            value={value.title}
            required={value.visible}
            placeholder="Điền sau khi đã bàn với gia đình và Conan"
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </label>
        <label>
          Điều kiện đã thống nhất
          <textarea
            rows={3}
            maxLength={1000}
            required={value.visible}
            value={value.conditions}
            placeholder="Ghi rõ cách cả nhà sẽ cùng xác nhận."
            onChange={(e) => setValue({ ...value, conditions: e.target.value })}
          />
        </label>
        <ImageField
          path={value.imagePath}
          setPath={(p) => setValue({ ...value, imagePath: p })}
          repo={repo}
          busy={busy}
          onUploadState={setUploading}
        />
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={value.visible}
            disabled={!value.title.trim() || !value.conditions.trim()}
            onChange={(e) => setValue({ ...value, visible: e.target.checked })}
          />
          <span>Hiện phần thưởng với Conan</span>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={value.received}
            onChange={(e) => setValue({ ...value, received: e.target.checked })}
          />
          <span>Cả nhà đã trao phần thưởng</span>
        </label>
        <div className="form-actions">
          <p className="muted">
            Bạn xác nhận cùng em; website không tự hứa hoặc tự trao phần thưởng.
          </p>
          <Button type="submit" busy={busy} disabled={uploading}>
            Lưu phần thưởng
          </Button>
        </div>
      </form>
    </details>
  )
}

export default function Manage(props: Parameters<typeof ManageForm>[0]) {
  if (!props.data.profile || !planForDate(props.data.plans, props.currentDate))
    return (
      <section className="card">
        <h2>Chưa có lịch học đang áp dụng</h2>
        <p>Kiểm tra dữ liệu trước khi chỉnh lịch.</p>
      </section>
    )
  return <ManageForm {...props} />
}
