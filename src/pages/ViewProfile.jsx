import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBlockedIds } from '../lib/blocks'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import OptionsMenu from '../components/OptionsMenu.jsx'

export default function ViewProfile() {
  const { userId } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    load()
  }, [userId])

  async function load() {
    setLoading(true)
    const blockedIds = await getBlockedIds(user.id)
    if (blockedIds.includes(userId)) {
      setBlocked(true)
      setProfile(null)
      setLoading(false)
      return
    }
    setBlocked(false)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  if (user?.id === userId) {
    navigate('/profile', { replace: true })
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10 text-center text-parchment-dim">
        <p>{t('profile.blockedNotice')}</p>
        <Link to="/" className="btn-ghost inline-flex mt-4">
          {t('nav.feed')}
        </Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10 text-center text-parchment-dim">
        <p>Profile not found.</p>
        <Link to="/" className="btn-ghost inline-flex mt-4">
          {t('nav.feed')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="card p-8 text-center relative">
        <div className="absolute top-4 right-4">
          <OptionsMenu
            targetType="profile"
            targetId={null}
            reportedUserId={profile.id}
            onBlocked={() => navigate('/')}
          />
        </div>

        <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-candle/40 bg-ink-softer flex items-center justify-center">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-display text-parchment-dim">
              {profile.username?.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-display">{profile.username}</h1>
        {profile.bio && <p className="mt-2 text-parchment-muted text-sm">{profile.bio}</p>}

        <button onClick={() => navigate(`/messages/${profile.id}`)} className="btn-primary mt-5">
          {t('post.message')}
        </button>
      </div>

      <div className="card p-6 mt-5">
        <h2 className="font-display text-lg mb-4">{t('profile.about')}</h2>
        <dl className="space-y-3 text-sm">
          {profile.gender && (
            <div className="flex justify-between border-b border-ink-line pb-3">
              <dt className="text-parchment-dim">{t('profile.gender')}</dt>
              <dd className="text-parchment">{t(`onboarding.gender.${profile.gender}`)}</dd>
            </div>
          )}
          {profile.past_relationships && (
            <div className="flex justify-between border-b border-ink-line pb-3">
              <dt className="text-parchment-dim">{t('profile.pastRelationships')}</dt>
              <dd className="text-parchment">{t(`onboarding.past.${profile.past_relationships}`)}</dd>
            </div>
          )}
          {profile.breakup_reason && (
            <div className="flex justify-between border-b border-ink-line pb-3">
              <dt className="text-parchment-dim">{t('profile.breakupReason')}</dt>
              <dd className="text-parchment text-right">
                {profile.breakup_reason === 'other'
                  ? profile.breakup_reason_other || t('onboarding.reason.other')
                  : t(`onboarding.reason.${profile.breakup_reason}`)}
              </dd>
            </div>
          )}
          {profile.healing_stage && (
            <div className="flex justify-between">
              <dt className="text-parchment-dim">{t('profile.healingStage')}</dt>
              <dd className="text-parchment">{t(`onboarding.healing.${profile.healing_stage}`)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}