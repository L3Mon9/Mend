import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Navbar() {
  const { session, profile, signOut } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  if (!session) return null

  const isActive = (path) => location.pathname === path

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="wick text-candle text-xl group-hover:animate-flicker">🕯️</span>
          <span className="font-display text-xl tracking-wide">Mend</span>
        </Link>

        <nav className="flex items-center gap-1">
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
          <Link
            to="/profile"
            className={`px-3 py-2 rounded-full text-sm font-body transition-colors ${
              isActive('/profile') ? 'text-candle' : 'text-parchment-muted hover:text-parchment'
            }`}
          >
            {profile?.username ? profile.username : 'Profile'}
          </Link>

          <button
            onClick={toggleLanguage}
            title="EN / TL"
            className="ml-1 w-9 h-9 rounded-full border border-ink-line text-xs font-mono font-semibold text-parchment-muted hover:text-candle hover:border-candle/40 transition-colors"
          >
            {lang === 'tl' ? 'EN' : 'TL'}
          </button>

          <button
            onClick={handleSignOut}
            className="ml-1 px-3 py-2 rounded-full text-sm font-body text-parchment-dim hover:text-parchment border border-transparent hover:border-ink-line transition-colors"
          >
            {t('nav.signout')}
          </button>
        </nav>
      </div>
    </header>
  )
}