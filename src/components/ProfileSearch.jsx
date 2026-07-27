import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBlockedIds } from '../lib/blocks'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function ProfileSearch() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const debounceRef = useRef(null)
  const blockedIdsRef = useRef([])

  useEffect(() => {
    if (user) getBlockedIds(user.id).then((ids) => (blockedIdsRef.current = ids))
  }, [user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${trimmed}%`)
        .neq('id', user?.id ?? '')
        .limit(8)

      if (!error) {
        const blocked = blockedIdsRef.current
        setResults((data || []).filter((p) => !blocked.includes(p.id)))
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query, user])

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-parchment-dim">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          className="input pl-10"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute z-20 mt-2 w-full card p-2 max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-xs text-parchment-dim px-3 py-2">{t('search.loading')}</p>
          )}

          {!loading && results.length === 0 && (
            <p className="text-xs text-parchment-dim px-3 py-2">{t('search.empty')}</p>
          )}

          {!loading &&
            results.map((p) => (
              <Link
                key={p.id}
                to={`/u/${p.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ink-softer transition-colors"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-dusk/20 border border-dusk/30 flex items-center justify-center text-sm font-semibold text-dusk-soft shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                  ) : (
                    p.username?.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-parchment truncate">{p.username}</p>
                  {p.bio && <p className="text-xs text-parchment-dim truncate">{p.bio}</p>}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}