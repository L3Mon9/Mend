import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function NewPost() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      is_anonymous: isAnonymous
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-display">{t('newpost.title')}</h1>
      <p className="text-parchment-dim text-sm mt-1 mb-6">{t('newpost.subtitle')}</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <textarea
          className="input min-h-[220px] resize-y font-body leading-relaxed"
          placeholder={t('newpost.placeholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={4000}
          required
        />
        <div className="flex items-center justify-between text-xs text-parchment-dim">
          <span>{content.length}/4000</span>
        </div>

        <label className="flex items-center gap-3 bg-ink-softer border border-ink-line rounded-xl px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 accent-candle"
          />
          <div>
            <p className="text-sm text-parchment">{t('newpost.anon.label')}</p>
            <p className="text-xs text-parchment-dim">{t('newpost.anon.desc')}</p>
          </div>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t('newpost.submitting') : t('newpost.submit')}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-ghost">
            {t('newpost.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}