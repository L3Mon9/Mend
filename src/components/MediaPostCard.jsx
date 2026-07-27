import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import CommentSection from './CommentSection.jsx'
import OptionsMenu from './OptionsMenu.jsx'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ]
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

export default function MediaPostCard({ post, onChanged }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [candleCount, setCandleCount] = useState(post.candle_count ?? 0)
  const [lit, setLit] = useState(post.lit_by_me ?? false)
  const [busy, setBusy] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const isOwn = post.user_id === user?.id
  const commentCount = post.comment_count ?? 0

  async function toggleCandle() {
    if (busy) return
    setBusy(true)
    try {
      if (lit) {
        await supabase.from('media_candles').delete().eq('media_post_id', post.id).eq('user_id', user.id)
        setLit(false)
        setCandleCount((c) => Math.max(0, c - 1))
      } else {
        await supabase.from('media_candles').insert({ media_post_id: post.id, user_id: user.id })
        setLit(true)
        setCandleCount((c) => c + 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(t('discover.deleteConfirm'))) return
    await supabase.from('media_posts').delete().eq('id', post.id)
    onChanged?.()
  }

  return (
    <article className="card overflow-hidden animate-rise">
      <div className="flex items-center justify-between gap-4 p-4 pb-0">
        <Link to={`/u/${post.user_id}`} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-dusk/20 border border-dusk/30 flex items-center justify-center text-sm font-semibold text-dusk-soft shrink-0 overflow-hidden">
            {post.author_avatar_url ? (
              <img src={post.author_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (post.author_username || '?').slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-parchment hover:text-candle transition-colors">
              {post.author_username || 'Someone'}
            </p>
            <p className="text-xs text-parchment-dim font-mono">{timeAgo(post.created_at)}</p>
          </div>
        </Link>

        {isOwn ? (
          <button onClick={handleDelete} className="text-xs text-parchment-dim hover:text-red-400 transition-colors">
            {t('post.delete')}
          </button>
        ) : (
          <OptionsMenu targetType="media_post" targetId={post.id} reportedUserId={post.user_id} onBlocked={onChanged} />
        )}
      </div>

      <div className="mt-3 bg-ink-softer">
        {post.media_type === 'image' ? (
          <img src={post.media_url} alt="" className="w-full max-h-[520px] object-contain" />
        ) : (
          <video src={post.media_url} controls className="w-full max-h-[520px]" />
        )}
      </div>

      {post.caption && (
        <p className="px-4 pt-3 text-parchment leading-relaxed whitespace-pre-wrap">{post.caption}</p>
      )}

      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={toggleCandle}
          disabled={busy}
          className={`inline-flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all ${
            lit
              ? 'bg-candle/15 text-candle border border-candle/40'
              : 'text-parchment-muted border border-ink-line hover:border-candle/40 hover:text-candle'
          }`}
          title={t('post.light')}
        >
          <span className={lit ? 'animate-flicker' : ''}>🕯️</span>
          {candleCount > 0 ? candleCount : t('post.light')}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className={`inline-flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all border ${
            showComments
              ? 'bg-dusk/15 text-dusk-soft border-dusk/40'
              : 'text-parchment-muted border-ink-line hover:border-dusk/40 hover:text-dusk-soft'
          }`}
        >
          💬 {commentCount > 0 ? commentCount : t('comments.label')}
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4">
          <CommentSection postId={post.id} type="media_post" />
        </div>
      )}
    </article>
  )
}