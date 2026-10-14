import { useState } from 'react'
import { Heart, MessageCircle, Plus } from 'lucide-react'
import type { Repository, Snapshot } from './types'
import type { Run } from './App'
import { gameState } from './gamification'
import { Asset, Button, Modal } from './ui'
import { MessageComposer } from './pages/Goals'

export default function MessageBubble({
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
  const [open, setOpen] = useState(false),
    [compose, setCompose] = useState(false)
  const unread = data.messages.filter((m) => !gameState(data).readMessageIds.includes(m.id))
  const show = () => {
    setOpen(true)
    if (unread.length)
      void run(async () => {
        for (let i = 0; i < unread.length; i += 200)
          await repo.gameAction({ type: 'read', ids: unread.slice(i, i + 200).map((m) => m.id) })
      }, '')
  }
  return (
    <>
      <button
        disabled={busy}
        className={`message-bubble ${unread.length ? 'has-unread' : ''}`}
        onClick={show}
        aria-label={`Lời nhắn dành cho em${unread.length ? `, ${unread.length} lời nhắn mới` : ''}`}
        title={
          unread.length
            ? `Lời nhắn mới từ ${unread[0].authorName}`
            : 'Lời nhắn từ ba mẹ và anh Khuê'
        }
      >
        <span className="bubble-heart">
          <MessageCircle size={21} />
        </span>
        <span>
          <strong>Lời nhắn cho em</strong>
          <small>{unread[0]?.authorName ?? 'Từ những người luôn bên em'}</small>
        </span>
        {unread.length > 0 && <b className="unread-count">{unread.length}</b>}
      </button>
      {open && (
        <Modal title="Những lời nhắn dành cho em" onClose={() => setOpen(false)}>
          <div className="bubble-messages">
            {data.profile?.familyPhoto && (
              <Asset
                path={data.profile.familyPhoto}
                repo={repo}
                alt="Gia đình luôn bên em"
                className="bubble-family-photo"
              />
            )}
            {data.messages.length ? (
              data.messages.map((m) => (
                <article key={m.id}>
                  <div>
                    <strong>
                      <Heart size={15} />
                      {m.authorName}
                    </strong>
                    <time dateTime={m.createdAt}>
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: 'numeric',
                        month: 'numeric',
                        timeZone: 'Asia/Ho_Chi_Minh',
                      }).format(new Date(m.createdAt))}
                    </time>
                  </div>
                  <p>{m.body}</p>
                  {m.imagePath && (
                    <Asset
                      path={m.imagePath}
                      repo={repo}
                      alt={`Ảnh từ ${m.authorName}`}
                      className="message-photo"
                    />
                  )}
                </article>
              ))
            ) : (
              <div className="bubble-empty">
                <Heart size={32} />
                <h3>Một góc dành cho lời động viên</h3>
                <p className="muted">
                  Lời nhắn của ba mẹ và anh Khuê sẽ ở đây, để em mở đọc bất cứ lúc nào.
                </p>
              </div>
            )}
            {data.actor.role !== 'learner' && (
              <Button
                className="secondary"
                onClick={() => {
                  setOpen(false)
                  setCompose(true)
                }}
              >
                <Plus size={16} />
                Viết lời nhắn cho Conan
              </Button>
            )}
          </div>
        </Modal>
      )}
      {compose && (
        <Modal title="Gửi một lời động viên" onClose={() => setCompose(false)}>
          <MessageComposer repo={repo} run={run} busy={busy} />
        </Modal>
      )}
    </>
  )
}
