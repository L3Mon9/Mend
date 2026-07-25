import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SuccessModal from '../components/SuccessModal.jsx'

export default function Login() {
  const { session, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // While the success modal is showing, we've deliberately signed the
  // user back out, so don't redirect them into the app yet.
  if (session && !showSuccess) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        const data = await signUpWithEmail(email, password, username)
        if (data.session) {
          await signOut()
          setNeedsConfirmation(false)
        } else {
          setNeedsConfirmation(true)
        }
        setPassword('')
        setShowSuccess(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleSuccessConfirm() {
    setShowSuccess(false)
    setMode('signin')
    setInfo(t('auth.readyToSignIn'))
  }

  async function handleGoogle() {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute -top-32 left-1/4 w-72 h-72 bg-candle/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-dusk/10 rounded-full blur-3xl" />

      <button
        onClick={toggleLanguage}
        className="absolute top-5 right-5 w-9 h-9 rounded-full border border-ink-line text-xs font-mono font-semibold text-parchment-muted hover:text-candle hover:border-candle/40 transition-colors z-10"
      >
        {lang === 'tl' ? 'EN' : 'TL'}
      </button>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="wick text-candle text-4xl inline-block animate-flicker">🕯️</div>
          <h1 className="mt-4 text-3xl font-display">Mend</h1>
          <p className="mt-2 text-parchment-dim text-sm leading-relaxed">{t('app.tagline')}</p>
        </div>

        <div className="card p-6">
          <div className="flex gap-1 mb-6 bg-ink-softer rounded-full p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 text-sm py-2 rounded-full transition-colors ${
                mode === 'signin' ? 'bg-candle text-ink font-semibold' : 'text-parchment-muted'
              }`}
            >
              {t('auth.signin')}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 text-sm py-2 rounded-full transition-colors ${
                mode === 'signup' ? 'bg-candle text-ink font-semibold' : 'text-parchment-muted'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <button onClick={handleGoogle} className="btn-ghost w-full mb-4" type="button">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            {t('auth.google')}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-ink-line" />
            <span className="text-xs text-parchment-dim">{t('auth.or')}</span>
            <div className="h-px flex-1 bg-ink-line" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                className="input"
                placeholder={t('auth.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                maxLength={24}
              />
            )}
            <input
              className="input"
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-dusk-soft">{info}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
              {busy ? t('auth.submitting') : mode === 'signin' ? t('auth.signin') : t('auth.signup')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-parchment-dim mt-6">{t('auth.footer')}</p>
      </div>

      <SuccessModal
        open={showSuccess}
        title={t('auth.successTitle')}
        message={needsConfirmation ? t('auth.successMsgPending') : t('auth.successMsgConfirmed')}
        confirmLabel={t('auth.successCta')}
        onConfirm={handleSuccessConfirm}
      />
    </div>
  )
}