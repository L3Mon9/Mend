import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import PostCard from '../components/PostCard.jsx'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [pastRelationships, setPastRelationships] = useState('')
  const [breakupReason, setBreakupReason] = useState('')
  const [breakupReasonOther, setBreakupReasonOther] = useState('')
  const [healingStage, setHealingStage] = useState('')

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [myPosts, setMyPosts] = useState(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setGender(profile.gender || '')
      setPastRelationships(profile.past_relationships || '')
      setBreakupReason(profile.breakup_reason || '')
      setBreakupReasonOther(profile.breakup_reason_other || '')
      setHealingStage(profile.healing_stage || '')
    }
  }, [profile])

  useEffect(() => {
    loadMyPosts()
  }, [user])

  async function loadMyPosts() {
    if (!user) return
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, content, is_anonymous, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyPosts(data || [])
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
      if (updateError) throw updateError

      await refreshProfile()
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        bio: bio.trim(),
        gender,
        past_relationships: pastRelationships,
        breakup_reason: breakupReason,
        breakup_reason_other: breakupReason === 'other' ? breakupReasonOther.trim() : null,
        healing_stage: healingStage
      })
      .eq('id', user.id)
    setBusy(false)
    if (!error) {
      setSaved(true)
      refreshProfile()
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-display">{t('profile.title')}</h1>
      <p className="text-parchment-dim text-sm mt-1 mb-6">{user?.email}</p>

      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-candle/40 bg-ink-softer flex items-center justify-center shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-display text-parchment-dim">
              {profile?.username?.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-ghost"
          >
            {uploading ? t('profile.uploading') : t('profile.changePhoto')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4 mb-6">
        <div>
          <label className="text-xs text-parchment-dim">{t('profile.username')}</label>
          <input
            className="input mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={24}
            required
          />
        </div>
        <div>
          <label className="text-xs text-parchment-dim">{t('profile.bio')}</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="border-t border-ink-line pt-4 space-y-4">
          <div>
            <label className="text-xs text-parchment-dim">{t('onboarding.gender.q')}</label>
            <select className="input mt-1" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">—</option>
              <option value="male">{t('onboarding.gender.male')}</option>
              <option value="female">{t('onboarding.gender.female')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-parchment-dim">{t('onboarding.past.q')}</label>
            <select
              className="input mt-1"
              value={pastRelationships}
              onChange={(e) => setPastRelationships(e.target.value)}
            >
              <option value="">—</option>
              <option value="first_time">{t('onboarding.past.first_time')}</option>
              <option value="two_to_three">{t('onboarding.past.two_to_three')}</option>
              <option value="many">{t('onboarding.past.many')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-parchment-dim">{t('onboarding.reason.q')}</label>
            <select
              className="input mt-1"
              value={breakupReason}
              onChange={(e) => setBreakupReason(e.target.value)}
            >
              <option value="">—</option>
              <option value="infidelity">{t('onboarding.reason.infidelity')}</option>
              <option value="long_distance">{t('onboarding.reason.long_distance')}</option>
              <option value="miscommunication">{t('onboarding.reason.miscommunication')}</option>
              <option value="family_financial">{t('onboarding.reason.family_financial')}</option>
              <option value="other">{t('onboarding.reason.other')}</option>
            </select>
            {breakupReason === 'other' && (
              <input
                className="input mt-2"
                placeholder={t('onboarding.reason.otherPlaceholder')}
                value={breakupReasonOther}
                onChange={(e) => setBreakupReasonOther(e.target.value)}
                maxLength={100}
              />
            )}
          </div>
          <div>
            <label className="text-xs text-parchment-dim">{t('onboarding.healing.q')}</label>
            <select
              className="input mt-1"
              value={healingStage}
              onChange={(e) => setHealingStage(e.target.value)}
            >
              <option value="">—</option>
              <option value="fresh">{t('onboarding.healing.fresh')}</option>
              <option value="moving_on">{t('onboarding.healing.moving_on')}</option>
              <option value="healed">{t('onboarding.healing.healed')}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t('profile.saving') : t('profile.save')}
          </button>
          {saved && <span className="text-sm text-candle">{t('profile.saved')}</span>}
        </div>
      </form>

      <h2 className="text-xl font-display mb-4">{t('profile.myPosts')}</h2>
      <div className="space-y-5">
        {myPosts?.length === 0 && <p className="text-parchment-dim text-sm">{t('profile.noPosts')}</p>}
        {myPosts?.map((post) => (
          <PostCard
            key={post.id}
            post={{ ...post, author_username: profile?.username }}
            onChanged={loadMyPosts}
          />
        ))}
      </div>
    </div>
  )
}