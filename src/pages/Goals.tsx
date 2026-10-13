import { useState } from 'react'
import {
  Check,
  Compass,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react'
import { addDays, shortDate, today } from '../domain'
import type { Goal, Repository, Snapshot } from '../types'
import type { Run } from '../App'
import { Asset, Button, Empty, ImageField, Modal, SectionHeading } from '../ui'

export default function Goals({
  data,
  repo,
  run,
  busy,
}: {
  data: Snapshot
  repo: Repository
  run: Run
  busy: boolean
}) {
  const [editing, setEditing] = useState<Goal | null>(null),
    [deleting, setDeleting] = useState<Goal | null>(null)
  const mentor = data.actor.role === 'mentor',
    reward = data.rewards.find((r) => r.visible)
  const newGoal = (): Goal => ({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    imagePath: null,
    milestones: [
      { id: crypto.randomUUID(), title: '', date: addDays(today(), 30), achieved: false },
      { id: crypto.randomUUID(), title: '', date: addDays(today(), 90), achieved: false },
    ],
  })
  return (
    <>
      <SectionHeading eyebrow="NHÌN VỀ PHÍA TRƯỚC" title="Điều em hướng tới">
        {mentor && data.goals.length < 2 && (
          <Button onClick={() => setEditing(newGoal())}>
            <Plus size={16} />
            Cùng chọn mục tiêu
          </Button>
        )}
      </SectionHeading>
      <p className="page-intro">
        Một đến ba tháng nữa, em muốn tự làm được điều gì? Cùng chọn một điều cụ thể và đi từng bước
        nhỏ.
      </p>
      <div className="goals-grid">
        {data.goals.map((goal) => {
          const achieved = goal.milestones.filter((m) => m.achieved).length
          return (
            <section className="card goal-card" key={goal.id}>
              <Asset path={goal.imagePath} repo={repo} alt={goal.title} className="goal-cover" />
              <div className="goal-card-heading">
                <span className="round-icon">
                  <Compass size={20} />
                </span>
                {mentor && (
                  <div className="button-row">
                    <button
                      className="icon-button"
                      onClick={() => setEditing(structuredClone(goal))}
                      aria-label={`Sửa mục tiêu ${goal.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => setDeleting(goal)}
                      aria-label={`Xoá mục tiêu ${goal.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h2>{goal.title}</h2>
              {goal.description && <p className="goal-description">{goal.description}</p>}
              <div className="goal-progress">
                <span>
                  {achieved}/{goal.milestones.length} mốc đã cùng xác nhận
                </span>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${goal.milestones.length ? (achieved / goal.milestones.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <ol className="milestone-list">
                {goal.milestones.map((m) => (
                  <li key={m.id} className={m.achieved ? 'achieved' : ''}>
                    <button
                      className="milestone-check"
                      disabled={!mentor || busy}
                      aria-label={`${m.achieved ? 'Bỏ xác nhận' : 'Xác nhận'} mốc ${m.title}`}
                      aria-pressed={m.achieved}
                      onClick={() =>
                        void run(
                          () =>
                            repo.saveGoal({
                              ...goal,
                              milestones: goal.milestones.map((item) =>
                                item.id === m.id ? { ...item, achieved: !item.achieved } : item,
                              ),
                            }),
                          m.achieved ? 'Đã cập nhật mốc.' : 'Đã cùng ghi nhận một mốc tiến bộ.',
                        )
                      }
                    >
                      <Check size={15} />
                    </button>
                    <div>
                      <strong>{m.title}</strong>
                      <small>
                        {m.achieved ? 'Đã cùng xác nhận' : `Cùng nhìn lại vào ${shortDate(m.date)}`}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="goal-footnote">
                Em và người hướng dẫn cùng nhìn lại rồi xác nhận từng mốc.
              </p>
            </section>
          )
        })}
      </div>
      {!data.goals.length && (
        <section className="card">
          <Empty
            icon={<Target size={30} />}
            title="Một điều em muốn làm được"
            text={
              mentor
                ? 'Cùng Conan chọn một mục tiêu vừa sức trong 1–3 tháng.'
                : 'Em và người hướng dẫn sẽ cùng chọn mục tiêu đầu tiên.'
            }
            action={
              mentor ? (
                <Button onClick={() => setEditing(newGoal())}>
                  <Plus size={16} />
                  Cùng chọn mục tiêu
                </Button>
              ) : undefined
            }
          />
        </section>
      )}
      {reward && (
        <section className="card reward-card">
          <Asset path={reward.imagePath} repo={repo} alt={reward.title} className="reward-cover" />
          <div>
            <p className="eyebrow">
              <Trophy size={14} />
              {reward.received ? 'CẢ NHÀ ĐÃ GHI NHẬN' : 'ĐIỀU ĐANG CHỜ EM'}
            </p>
            <h2>{reward.title}</h2>
            <p>{reward.conditions}</p>
            {reward.received && (
              <span className="small-tag">
                <Check size={14} />
                Đã nhận
              </span>
            )}
          </div>
        </section>
      )}
      <section className="card messages-card">
        <SectionHeading title="Có người luôn cổ vũ em" />
        <Asset
          path={data.profile!.familyPhoto}
          repo={repo}
          alt="Ảnh gia đình của em"
          className="messages-family-photo"
        />
        {data.actor.role !== 'learner' && <MessageComposer repo={repo} run={run} busy={busy} />}
        {data.messages.length ? (
          <div className="message-list">
            {data.messages.map((message) => (
              <article className="message" key={message.id}>
                <div className="message-heading">
                  <span className="round-icon">
                    <Heart size={16} />
                  </span>
                  <div>
                    <strong>{message.authorName}</strong>
                    <small>{shortDate(message.createdAt.slice(0, 10))}</small>
                  </div>
                  {(mentor || message.authorId === data.actor.id) && (
                    <button
                      className="icon-button danger"
                      disabled={busy}
                      onClick={() =>
                        void run(() => repo.deleteMessage(message.id), 'Đã gỡ lời nhắn.')
                      }
                      aria-label={`Gỡ lời nhắn của ${message.authorName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p>{message.body}</p>
                <Asset
                  path={message.imagePath}
                  repo={repo}
                  alt="Ảnh kèm lời nhắn"
                  className="message-photo"
                />
              </article>
            ))}
          </div>
        ) : (
          <Empty
            icon={<MessageCircle size={26} />}
            title="Lời nhắn sẽ ở đây"
            text={
              data.actor.role === 'learner'
                ? 'Những lời động viên thật sẽ được giữ lại để em xem khi cần.'
                : 'Ghi nhận một điều cụ thể em đã làm tốt, hoặc gửi em một lời cổ vũ.'
            }
          />
        )}
      </section>
      {editing && (
        <GoalEditor
          goal={editing}
          repo={repo}
          run={run}
          busy={busy}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Modal title="Gỡ mục tiêu này?" onClose={() => setDeleting(null)}>
          <p>Gỡ “{deleting.title}” và các mốc của mục tiêu này. Tiến độ thói quen vẫn được giữ.</p>
          <div className="modal-actions">
            <Button className="secondary" onClick={() => setDeleting(null)}>
              Giữ lại
            </Button>
            <Button
              className="danger-button"
              busy={busy}
              onClick={async () => {
                if (await run(() => repo.deleteGoal(deleting.id), 'Đã gỡ mục tiêu.'))
                  setDeleting(null)
              }}
            >
              Gỡ mục tiêu
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
export function MessageComposer({
  repo,
  run,
  busy,
}: {
  repo: Repository
  run: Run
  busy: boolean
}) {
  const [body, setBody] = useState(''),
    [imagePath, setImagePath] = useState<string | null>(null),
    [uploading, setUploading] = useState(false),
    [feedback, setFeedback] = useState(''),
    [error, setError] = useState('')
  return (
    <form
      className="message-composer"
      onSubmit={async (e) => {
        e.preventDefault()
        setFeedback('')
        setError('')
        if (await run(() => repo.saveMessage(body, imagePath), '')) {
          setBody('')
          setImagePath(null)
          setFeedback('Đã gửi em lời động viên.')
        } else setError('Chưa xác nhận gửi. Nội dung vẫn được giữ để thử lại.')
      }}
    >
      <label>
        Một lời gửi em
        <textarea
          value={body}
          required
          maxLength={1000}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ví dụ: hôm nay ba thấy con đã tự ngồi vào đọc sách. Ba rất vui vì điều đó."
        />
      </label>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="composer-bottom">
        <details className="image-disclosure">
          <summary>
            <Plus size={14} />
            Thêm ảnh cùng lời nhắn
          </summary>
          <ImageField
            path={imagePath}
            setPath={setImagePath}
            repo={repo}
            busy={busy}
            onUploadState={setUploading}
          />
        </details>
        <Button type="submit" busy={busy} disabled={uploading || !body.trim()}>
          <Send size={16} />
          Gửi lời nhắn
        </Button>
      </div>
    </form>
  )
}
function GoalEditor({
  goal,
  repo,
  run,
  busy,
  onClose,
}: {
  goal: Goal
  repo: Repository
  run: Run
  busy: boolean
  onClose: () => void
}) {
  const [value, setValue] = useState(goal),
    [uploading, setUploading] = useState(false)
  return (
    <Modal title="Cùng chọn một mục tiêu" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (await run(() => repo.saveGoal(value), 'Đã lưu điều em hướng tới.')) onClose()
        }}
      >
        <label>
          Điều em muốn tự làm được
          <input
            required
            maxLength={100}
            value={value.title}
            placeholder="Ví dụ: tự nhớ đọc sách sau bữa tối"
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </label>
        <label>
          Vì sao điều này có ý nghĩa với em?
          <textarea
            rows={2}
            maxLength={1000}
            value={value.description}
            onChange={(e) => setValue({ ...value, description: e.target.value })}
            placeholder="Viết bằng lời của em, sau khi cùng trao đổi."
          />
        </label>
        <ImageField
          path={value.imagePath}
          setPath={(p) => setValue({ ...value, imagePath: p })}
          repo={repo}
          busy={busy}
          onUploadState={setUploading}
        />
        <div className="milestone-editor-heading">
          <h3>Các mốc nhỏ</h3>
          {value.milestones.length < 6 && (
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setValue({
                  ...value,
                  milestones: [
                    ...value.milestones,
                    {
                      id: crypto.randomUUID(),
                      title: '',
                      date: addDays(today(), 30),
                      achieved: false,
                    },
                  ],
                })
              }
            >
              <Plus size={14} />
              Thêm mốc
            </button>
          )}
        </div>
        <div className="milestone-editor">
          {value.milestones.map((m, index) => (
            <div key={m.id}>
              <label>
                Mốc {index + 1}
                <input
                  required
                  maxLength={100}
                  value={m.title}
                  placeholder="Một việc cụ thể em có thể làm được"
                  onChange={(e) =>
                    setValue({
                      ...value,
                      milestones: value.milestones.map((item) =>
                        item.id === m.id ? { ...item, title: e.target.value } : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Ngày nhìn lại
                <input
                  type="date"
                  required
                  value={m.date}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      milestones: value.milestones.map((item) =>
                        item.id === m.id ? { ...item, date: e.target.value } : item,
                      ),
                    })
                  }
                />
              </label>
              {value.milestones.length > 1 && (
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() =>
                    setValue({
                      ...value,
                      milestones: value.milestones.filter((item) => item.id !== m.id),
                    })
                  }
                  aria-label={`Gỡ mốc ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Để sau
          </Button>
          <Button type="submit" busy={busy} disabled={uploading}>
            Lưu mục tiêu <Check size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  )
}
