import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

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

export default function PostCard({ post, onChanged }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [candleCount, setCandleCount] = useState(post.candle_count ?? 0)
  const [lit, setLit] = useState(post.lit_by_me ?? false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setCandleCount(post.candle_count ?? 0)
    setLit(post.lit_by_me ?? false)
  }, [post.candle_count, post.lit_by_me])

  const displayName = post.is_anonymous ? t('post.anonymous') : post.author_username || 'Someone'
  const isOwn = post.user_id === user?.id
  const canMessage = !post.is_anonymous && !isOwn
  const canLinkProfile = !post.is_anonymous

  async function toggleCandle() {
    if (busy) return
    setBusy(true)
    try {
      if (lit) {
        await supabase.from('candles').delete().eq('post_id', post.id).eq('user_id', user.id)
        setLit(false)
        setCandleCount((c) => Math.max(0, c - 1))
      } else {
        await supabase.from('candles').insert({ post_id: post.id, user_id: user.id })
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
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onChanged?.()
  }

  function startConversation() {
    navigate(`/messages/${post.user_id}`)
  }

  const avatar = (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden ${
        post.is_anonymous
          ? 'bg-ink-softer text-parchment-dim border border-dashed border-ink-line'
          : 'bg-dusk/20 text-dusk-soft border border-dusk/30'
      }`}
    >
      {!post.is_anonymous && post.author_avatar_url ? (
        <img src={post.author_avatar_url} alt={displayName} className="w-full h-full object-cover" />
      ) : post.is_anonymous ? (
        '?'
      ) : (
        displayName.slice(0, 1).toUpperCase()
      )}
    </div>
  )

  return (
    <article className="card p-6 animate-rise">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {canLinkProfile ? (
            <Link to={`/u/${post.user_id}`}>{avatar}</Link>
          ) : (
            avatar
          )}
          <div>
            {canLinkProfile ? (
              <Link to={`/u/${post.user_id}`} className="text-sm font-medium text-parchment hover:text-candle transition-colors">
                {displayName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-parchment">{displayName}</p>
            )}
            <p className="text-xs text-parchment-dim font-mono">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {isOwn && (
          <button
            onClick={handleDelete}
            className="text-xs text-parchment-dim hover:text-red-400 transition-colors"
          >
            {t('post.delete')}
          </button>
        )}
      </div>

      <p className="mt-4 text-parchment leading-relaxed whitespace-pre-wrap font-body">
        {post.content}
      </p>

      <div className="mt-5 flex items-center gap-3 border-t border-ink-line pt-4">
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

        {canMessage && (
          <button
            onClick={startConversation}
            className="text-sm text-parchment-muted hover:text-dusk-soft transition-colors ml-auto"
          >
            {t('post.message')}
          </button>
        )}
      </div>
    </article>
  )
}