import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import ReportModal from './ReportModal.jsx'

// targetType: 'post' | 'comment' | 'media_post' | 'profile' | 'message'
export default function OptionsMenu({ targetType, targetId, reportedUserId, onBlocked }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [busy, setBusy] = useState(false)

  // Can't report or block yourself.
  if (!reportedUserId || reportedUserId === user?.id) return null

  async function handleBlock() {
    setOpen(false)
    if (!confirm(t('block.confirm'))) return
    setBusy(true)
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: user.id, blocked_id: reportedUserId })
    setBusy(false)
    if (!error) onBlocked?.()
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="text-parchment-dim hover:text-parchment w-7 h-7 flex items-center justify-center rounded-full hover:bg-ink-softer transition-colors leading-none"
        title={t('options.title')}
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 w-44 card p-1.5">
            <button
              onClick={() => {
                setOpen(false)
                setShowReport(true)
              }}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-ink-softer text-parchment-muted transition-colors"
            >
              {t('options.report')}
            </button>
            <button
              onClick={handleBlock}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-ink-softer text-red-400 transition-colors"
            >
              {t('options.block')}
            </button>
          </div>
        </>
      )}

      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType={targetType}
        targetId={targetId}
        reportedUserId={reportedUserId}
      />
    </div>
  )
}