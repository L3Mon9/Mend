import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Conversation() {
  const { partnerId } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [partnerName, setPartnerName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

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
      if (!cancelled) setMessages(messageData || [])

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

      <div className="flex-1 overflow-y-auto py-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  mine
                    ? 'bg-candle text-ink rounded-br-sm'
                    : 'bg-ink-soft border border-ink-line text-parchment rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
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