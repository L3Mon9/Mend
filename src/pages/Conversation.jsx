import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const REACTION_EMOJIS = ['❤️', '😂', '😢', '👍', '🕯️']

function groupReactions(list) {
  const byEmoji = new Map()
  for (const r of list) {
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, [])
    byEmoji.get(r.emoji).push(r)
  }
  return [...byEmoji.entries()].map(([emoji, rows]) => ({ emoji, rows }))
}

export default function Conversation() {
  const { partnerId } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState({}) // messageId -> [{id, emoji, user_id}]
  const [partnerName, setPartnerName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [pickerFor, setPickerFor] = useState(null)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  async function loadReactions(messageIds) {
    if (!messageIds.length) {
      setReactions({})
      return
    }
    const { data } = await supabase
      .from('message_reactions')
      .select('id, message_id, user_id, emoji')
      .in('message_id', messageIds)

    const grouped = {}
    for (const r of data || []) {
      grouped[r.message_id] = grouped[r.message_id] || []
      grouped[r.message_id].push(r)
    }
    setReactions(grouped)
  }

  // Load partner profile + message history whenever the conversation changes
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', partnerId)
        .single()
      if (!cancelled) setPartnerName(profileData?.username || 'Someone')

      const { data: messageData } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
      if (!cancelled) {
        setMessages(messageData || [])
        await loadReactions((messageData || []).map((m) => m.id))
      }

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false)

      if (!cancelled) setLoading(false)
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [partnerId, user.id])

  // Set up the realtime subscription separately, synchronously, so it isn't
  // affected by the async profile/message fetch above (avoids a StrictMode
  // dev-mode double-subscribe race on the same channel).
  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${user.id}-${partnerId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          const isRelevant =
            (m.sender_id === user.id && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === user.id)
          if (isRelevant) {
            setMessages((prev) => (prev.some((existing) => existing.id === m.id) ? prev : [...prev, m]))
            if (m.receiver_id === user.id) {
              supabase
                .from('messages')
                .update({ read: true })
                .eq('id', m.id)
                .then(() => {})
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          setMessages((prev) => prev.map((existing) => (existing.id === m.id ? { ...existing, ...m } : existing)))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => {
          // Reaction rows don't reliably carry message_id on delete payloads,
          // so just re-sync reactions for the messages we currently have.
          loadReactions(messagesRef.current.map((m) => m.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerId, user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content
    })
    if (error) console.error(error)
  }
// add near other useState
const [bursts, setBursts] = useState([]) // [{id, emoji, mine}]
const [justReacted, setJustReacted] = useState(null) // `${messageId}:${emoji}`

async function toggleReaction(messageId, emoji, mine) {
  setPickerFor(null)
  const existing = (reactions[messageId] || []).find((r) => r.emoji === emoji && r.user_id === user.id)

  if (!existing) {
    // trigger the floating burst + pop only when adding a reaction
    const burstId = Date.now()
    setBursts((prev) => [...prev, { id: burstId, emoji, mine }])
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== burstId)), 900)
    setJustReacted(`${messageId}:${emoji}`)
    setTimeout(() => setJustReacted(null), 350)
  }

  // ...keep the rest of your existing toggleReaction logic here
}
  async function toggleReaction(messageId, emoji) {
    setPickerFor(null)
    const mine = (reactions[messageId] || []).find((r) => r.emoji === emoji && r.user_id === user.id)

    if (mine) {
      setReactions((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter((r) => r.id !== mine.id)
      }))
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
    } else {
      const optimisticId = `optimistic-${Date.now()}`
      setReactions((prev) => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), { id: optimisticId, emoji, user_id: user.id, message_id: messageId }]
      }))
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji })
      loadReactions(messagesRef.current.map((m) => m.id))
    }
  }

  // Last message I sent — used to show a single "Seen" indicator, like a
  // normal chat app, instead of repeating it under every bubble.
  <div className="relative group max-w-[75%]">
  {bursts.filter(() => pickerFor === null).map((b) => (
    <span
      key={b.id}
      className="absolute -top-2 text-xl animate-float-up"
      style={{ [mine ? 'right' : 'left']: '8px' }}
    >
      {b.emoji}
    </span>
  ))}
  {/* existing bubble div dito */}
</div>
  const lastMineId = [...messages].reverse().find((m) => m.sender_id === user.id)?.id

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col h-[calc(100vh-73px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-ink-line">
        <button onClick={() => navigate('/messages')} className="text-parchment-dim hover:text-parchment">
          ←
        </button>
        <div className="w-8 h-8 rounded-full bg-dusk/20 border border-dusk/30 flex items-center justify-center text-sm font-semibold text-dusk-soft">
          {partnerName.slice(0, 1).toUpperCase()}
        </div>
        <p className="font-medium">{partnerName}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-5 space-y-1">
        {loading && (
          <div className="flex justify-center py-10">
            <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id
          const grouped = groupReactions(reactions[m.id] || [])
          const showPicker = pickerFor === m.id

          return (
            <div key={m.id} className={`pb-3 flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className="relative group max-w-[75%]">
                <div
                  onClick={() => setPickerFor(showPicker ? null : m.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap cursor-pointer ${
                    mine
                      ? 'bg-candle text-ink rounded-br-sm'
                      : 'bg-ink-soft border border-ink-line text-parchment rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>

                {showPicker && (
                  <div
                    className={`absolute z-10 -top-11 flex gap-1 bg-ink-soft border border-ink-line rounded-full px-2 py-1.5 shadow-lg ${
                      mine ? 'right-0' : 'left-0'
                    }`}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(m.id, emoji)}
                        className="text-base hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {grouped.length > 0 && (
                <div className={`flex gap-1 mt-1 flex-wrap ${mine ? 'justify-end' : 'justify-start'}`}>
                  {grouped.map(({ emoji, rows }) => {
  const reactedByMe = rows.some((r) => r.user_id === user.id)
  const pulseKey = justReacted === `${m.id}:${emoji}` ? `${emoji}-pulse` : emoji
  return (
    <button
      key={pulseKey}
      onClick={() => toggleReaction(m.id, emoji, mine)}
      className={`text-xs rounded-full px-2 py-0.5 border flex items-center gap-1 ${
        justReacted === `${m.id}:${emoji}` ? 'animate-pop' : ''
      } ${reactedByMe ? 'bg-candle/15 border-candle/40 text-candle' : 'bg-ink-softer border-ink-line text-parchment-muted'}`}
    >
      <span>{emoji}</span>
      {rows.length > 1 && <span>{rows.length}</span>}
    </button>
  )
})}
                </div>
              )}

              {mine && m.id === lastMineId && m.read && (
                <p className="text-[10px] text-parchment-dim mt-1">{t('messages.seen')}</p>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-ink-line">
        <input
          className="input"
          placeholder={t('messages.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0">
          {t('messages.send')}
        </button>
      </form>
    </div>
  )
}