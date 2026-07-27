import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const REASONS = ['harassment', 'hate_speech', 'sexual_content', 'spam', 'self_harm', 'other']

// targetType: 'post' | 'comment' | 'media_post' | 'profile' | 'message'
// targetId: uuid of that row (null is fine for a plain profile report)
// reportedUserId: the author being reported
export default function ReportModal({ open, onClose, targetType, targetId, reportedUserId }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim()
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  function handleClose() {
    setReason('')
    setDetails('')
    setDone(false)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="card relative w-full max-w-sm p-6 animate-rise">
        {done ? (
          <div className="text-center py-4">
            <div className="wick text-candle text-3xl inline-block animate-flicker mb-3">🕯️</div>
            <h2 className="text-lg font-display text-parchment">{t('report.thanksTitle')}</h2>
            <p className="text-parchment-muted text-sm mt-2">{t('report.thanksDesc')}</p>
            <button onClick={handleClose} className="btn-primary w-full mt-5">
              {t('report.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-display text-parchment mb-1">{t('report.title')}</h2>
            <p className="text-xs text-parchment-dim mb-4">{t('report.subtitle')}</p>

            <div className="space-y-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer text-sm ${
                    reason === r
                      ? 'bg-candle/15 border-candle text-parchment'
                      : 'bg-ink-softer border-ink-line text-parchment-muted hover:border-candle/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-candle"
                  />
                  {t(`report.reason.${r}`)}
                </label>
              ))}
            </div>

            <textarea
              className="input mt-3 min-h-[70px] text-sm"
              placeholder={t('report.detailsPlaceholder')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />

            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

            <div className="flex items-center gap-3 mt-4">
              <button type="submit" disabled={!reason || busy} className="btn-primary flex-1">
                {busy ? t('report.submitting') : t('report.submit')}
              </button>
              <button type="button" onClick={handleClose} className="btn-ghost">
                {t('report.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}