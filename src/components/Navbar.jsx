import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Navbar() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [genderOpen, setGenderOpen] = useState(false)
  const [savingPref, setSavingPref] = useState(false)

  if (!session) return null

  const isActive = (path) => location.pathname === path

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  async function setPreferredGender(value) {
    setSavingPref(true)
    await supabase.from('profiles').update({ preferred_gender: value }).eq('id', profile.id)
    await refreshProfile()
    setSavingPref(false)
    setGenderOpen(false)
  }

  function closeMenu() {
    setMenuOpen(false)
    setGenderOpen(false)
  }

  const genderLabel =
    profile?.preferred_gender === 'male'
      ? t('settings.gender.male')
      : profile?.preferred_gender === 'female'
      ? t('settings.gender.female')
      : t('settings.gender.all')

  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="wick text-candle text-xl group-hover:animate-flicker">🕯️</span>
          <span className="font-display text-xl tracking-wide">Mend</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/discover"
            className={`px-3 py-2 rounded-full text-sm font-body transition-colors ${
              isActive('/discover') ? 'text-candle' : 'text-parchment-muted hover:text-parchment'
            }`}
          >
            {t('Discover')}
          </Link>
          <Link
            to="/"
            className={`px-3 py-2 rounded-full text-sm font-body transition-colors ${
              isActive('/') ? 'text-candle' : 'text-parchment-muted hover:text-parchment'
            }`}
          >
            {t('nav.feed')}
          </Link>
          <Link
            to="/new"
            className={`px-3 py-2 rounded-full text-sm font-body transition-colors ${
              isActive('/new') ? 'text-candle' : 'text-parchment-muted hover:text-parchment'
            }`}
          >
            {t('nav.write')}
          </Link>
          <Link
            to="/messages"
            className={`px-3 py-2 rounded-full text-sm font-body transition-colors ${
              isActive('/messages') || location.pathname.startsWith('/messages')
                ? 'text-candle'
                : 'text-parchment-muted hover:text-parchment'
            }`}
          >
            {t('nav.messages')}
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title={t('nav.settings')}
              className="ml-1 w-9 h-9 rounded-full border border-ink-line flex items-center justify-center text-parchment-muted hover:text-candle hover:border-candle/40 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeMenu} />
                <div className="absolute right-0 mt-2 z-20 w-64 card p-2">
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-softer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-dusk/20 border border-dusk/30 flex items-center justify-center text-xs font-semibold text-dusk-soft overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile?.username?.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm text-parchment">{profile?.username || 'Profile'}</span>
                  </Link>

                  <div className="h-px bg-ink-line my-1.5" />

                  <div className="px-1 py-1">
                    <p className="text-xs text-parchment-dim px-2 mb-1.5">{t('settings.genderPrefLabel')}</p>

                    {!genderOpen ? (
                      <button
                        onClick={() => setGenderOpen(true)}
                        disabled={savingPref}
                        className="w-full text-left px-3 py-2 rounded-xl bg-ink-softer border border-ink-line text-sm text-parchment hover:border-candle/40 transition-colors flex items-center justify-between"
                      >
                        <span>{genderLabel}</span>
                        <span className="text-parchment-dim text-xs">{t('settings.change')}</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        {['male', 'female', 'all'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setPreferredGender(g)}
                            disabled={savingPref}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                              profile?.preferred_gender === g
                                ? 'bg-candle/15 border-candle text-parchment'
                                : 'bg-ink-softer border-ink-line text-parchment-muted hover:border-candle/40'
                            }`}
                          >
                            {t(`settings.gender.${g}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-ink-line my-1.5" />

                  <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-ink-softer text-sm text-parchment-muted transition-colors"
                  >
                    <span>{t('nav.language')}</span>
                    <span className="font-mono text-xs border border-ink-line rounded-full px-2 py-0.5">
                      {lang === 'tl' ? 'TL' : 'EN'}
                    </span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-ink-softer text-sm text-red-400 transition-colors"
                  >
                    {t('nav.signout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}