import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBlockedIds } from '../lib/blocks'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Messages() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [conversations, setConversations] = useState(null)

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setConversations([])
      return
    }

    const blockedIds = await getBlockedIds(user.id)

    const byPartner = new Map()
    for (const m of data) {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (blockedIds.includes(partnerId)) continue
      if (!byPartner.has(partnerId)) {
        byPartner.set(partnerId, {
          partnerId,
          lastMessage: m,
          unread: m.receiver_id === user.id && !m.read ? 1 : 0
        })
      } else if (m.receiver_id === user.id && !m.read) {
        byPartner.get(partnerId).unread += 1
      }
    }

    const partnerIds = [...byPartner.keys()]
    let profiles = []
    if (partnerIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', partnerIds)
      profiles = profileData || []
    }

    const list = partnerIds.map((id) => {
      const info = byPartner.get(id)
      const profile = profiles.find((p) => p.id === id)
      return { ...info, username: profile?.username || 'Someone' }
    })

    setConversations(list)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-display">{t('messages.title')}</h1>
      <p className="text-parchment-dim text-sm mt-1 mb-6">{t('messages.subtitle')}</p>

      {conversations === null && (
        <div className="flex justify-center py-20">
          <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
        </div>
      )}

      {conversations?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-parchment-muted">{t('messages.empty')}</p>
          <p className="text-parchment-dim text-sm mt-1">{t('messages.emptyDesc')}</p>
        </div>
      )}

      <div className="space-y-2">
        {conversations?.map((c) => (
          <Link
            key={c.partnerId}
            to={`/messages/${c.partnerId}`}
            className="card flex items-center justify-between px-5 py-4 hover:border-candle/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-dusk/20 border border-dusk/30 flex items-center justify-center text-sm font-semibold text-dusk-soft shrink-0">
                {c.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-parchment">{c.username}</p>
                <p className="text-xs text-parchment-dim truncate max-w-xs">{c.lastMessage.content}</p>
              </div>
            </div>
            {c.unread > 0 && (
              <span className="bg-candle text-ink text-xs font-semibold rounded-full px-2 py-0.5">
                {c.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}