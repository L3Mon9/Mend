import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import OptionsMenu from './OptionsMenu.jsx'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60]
  ]
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value}${label}`
  }
  return 'now'
}

function buildTree(flat) {
  const byId = new Map(flat.map((c) => [c.id, { ...c, children: [] }]))
  const roots = []
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id).children.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

function CommentNode({ comment, depth, onChanged, replyTarget, setReplyTarget, config }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [lit, setLit] = useState(comment.lit_by_me)
  const [count, setCount] = useState(comment.candle_count)
  const [busy, setBusy] = useState(false)
  const [replyText, setReplyText] = useState('')
  const isOwn = comment.user_id === user?.id
  const isReplying = replyTarget === comment.id

  async function toggleCandle() {
    if (busy) return
    setBusy(true)
    try {
      if (lit) {
        await supabase.from(config.candlesTable).delete().eq(config.candleFk, comment.id).eq('user_id', user.id)
        setLit(false)
        setCount((c) => Math.max(0, c - 1))
      } else {
        await supabase.from(config.candlesTable).insert({ [config.candleFk]: comment.id, user_id: user.id })
        setLit(true)
        setCount((c) => c + 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(t('comments.deleteConfirm'))) return
    await supabase.from(config.commentsTable).delete().eq('id', comment.id)
    onChanged()
  }

  async function submitReply(e) {
    e.preventDefault()
    if (!replyText.trim()) return
    const { error } = await supabase.from(config.commentsTable).insert({
      [config.postFk]: config.postId,
      user_id: user.id,
      parent_id: comment.id,
      content: replyText.trim()
    })
    if (!error) {
      setReplyText('')
      setReplyTarget(null)
      onChanged()
    }
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 pl-4 border-l border-ink-line' : 'mt-3'}>
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-dusk/20 border border-dusk/30 flex items-center justify-center text-xs font-semibold text-dusk-soft shrink-0 overflow-hidden">
          {comment.author_avatar_url ? (
            <img src={comment.author_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (comment.author_username || '?').slice(0, 1).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-ink-softer rounded-2xl px-3.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/u/${comment.user_id}`}
                className="text-xs font-medium text-parchment hover:text-candle transition-colors"
              >
                {comment.author_username || 'Someone'}
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-parchment-dim font-mono">{timeAgo(comment.created_at)}</span>
                {!isOwn && (
                  <OptionsMenu
                    targetType={config.reportTargetType}
                    targetId={comment.id}
                    reportedUserId={comment.user_id}
                    onBlocked={onChanged}
                  />
                )}
              </div>
            </div>
            <p className="text-sm text-parchment mt-0.5 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-1.5 pl-1">
            <button
              onClick={toggleCandle}
              disabled={busy}
              className={`text-xs flex items-center gap-1 transition-colors ${
                lit ? 'text-candle' : 'text-parchment-dim hover:text-candle'
              }`}
            >
              <span className={lit ? 'animate-flicker' : ''}>🕯️</span>
              {count > 0 ? count : t('post.light')}
            </button>
            <button
              onClick={() => setReplyTarget(isReplying ? null : comment.id)}
              className="text-xs text-parchment-dim hover:text-parchment transition-colors"
            >
              {t('comments.reply')}
            </button>
            {isOwn && (
              <button
                onClick={handleDelete}
                className="text-xs text-parchment-dim hover:text-red-400 transition-colors"
              >
                {t('post.delete')}
              </button>
            )}
          </div>

          {isReplying && (
            <form onSubmit={submitReply} className="flex gap-2 mt-2">
              <input
                className="input flex-1 text-sm py-1.5"
                placeholder={t('comments.replyPlaceholder')}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={1000}
                autoFocus
              />
              <button type="submit" className="btn-primary text-sm px-3 py-1.5 shrink-0">
                {t('comments.submit')}
              </button>
            </form>
          )}

          {comment.children?.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              onChanged={onChanged}
              replyTarget={replyTarget}
              setReplyTarget={setReplyTarget}
              config={config}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Reusable comment thread.
 *
 * Pass `type="post"` (default) for Feed text posts, or `type="media_post"`
 * for Discover photo/video posts — the underlying tables differ, everything
 * else about the UI is identical.
 */
export default function CommentSection({ postId, type = 'post' }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const config =
    type === 'media_post'
      ? {
          postId,
          postFk: 'media_post_id',
          commentsTable: 'media_comments',
          candlesTable: 'media_comment_candles',
          candleFk: 'media_comment_id',
          reportTargetType: 'media_comment'
        }
      : {
          postId,
          postFk: 'post_id',
          commentsTable: 'comments',
          candlesTable: 'comment_candles',
          candleFk: 'comment_id',
          reportTargetType: 'comment'
        }

  useEffect(() => {
    load()
  }, [postId, type])

  async function load() {
    const { data, error } = await supabase
      .from(config.commentsTable)
      .select(`id, ${config.postFk}, user_id, parent_id, content, created_at`)
      .eq(config.postFk, postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setComments([])
      return
    }

    const ids = data.map((c) => c.id)
    const userIds = [...new Set(data.map((c) => c.user_id))]

    let candleRows = []
    let profileRows = []
    if (ids.length > 0) {
      const [{ data: candles }, { data: profiles }] = await Promise.all([
        supabase.from(config.candlesTable).select(`${config.candleFk}, user_id`).in(config.candleFk, ids),
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
      ])
      candleRows = candles || []
      profileRows = profiles || []
    }

    const enriched = data.map((c) => {
      const lit = candleRows.filter((r) => r[config.candleFk] === c.id)
      const profile = profileRows.find((p) => p.id === c.user_id)
      return {
        ...c,
        author_username: profile?.username,
        author_avatar_url: profile?.avatar_url,
        candle_count: lit.length,
        lit_by_me: lit.some((r) => r.user_id === user?.id)
      }
    })

    setComments(enriched)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    const { error } = await supabase.from(config.commentsTable).insert({
      [config.postFk]: postId,
      user_id: user.id,
      content: text.trim()
    })
    setBusy(false)
    if (!error) {
      setText('')
      load()
    }
  }

  const tree = comments ? buildTree(comments) : []

  return (
    <div className="border-t border-ink-line mt-4 pt-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-1">
        <input
          className="input flex-1 text-sm"
          placeholder={t('comments.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <button type="submit" disabled={busy} className="btn-primary text-sm px-4 shrink-0">
          {t('comments.submit')}
        </button>
      </form>

      {comments === null && <p className="text-xs text-parchment-dim mt-3">{t('comments.loading')}</p>}
      {comments?.length === 0 && <p className="text-xs text-parchment-dim mt-3">{t('comments.empty')}</p>}

      {tree.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          depth={0}
          onChanged={load}
          replyTarget={replyTarget}
          setReplyTarget={setReplyTarget}
          config={config}
        />
      ))}
    </div>
  )
}