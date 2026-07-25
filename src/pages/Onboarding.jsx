import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const TOTAL_STEPS = 4

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
        selected
          ? 'bg-candle/15 border-candle text-parchment'
          : 'bg-ink-softer border-ink-line text-parchment-muted hover:border-candle/40'
      }`}
    >
      {children}
    </button>
  )
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [gender, setGender] = useState('')
  const [pastRelationships, setPastRelationships] = useState('')
  const [breakupReason, setBreakupReason] = useState('')
  const [breakupReasonOther, setBreakupReasonOther] = useState('')
  const [healingStage, setHealingStage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const stepValid =
    (step === 1 && gender) ||
    (step === 2 && pastRelationships) ||
    (step === 3 && breakupReason && (breakupReason !== 'other' || breakupReasonOther.trim())) ||
    (step === 4 && healingStage)

  function goNext() {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else handleFinish()
  }

  function goBack() {
    if (step > 1) setStep(step - 1)
  }

  async function handleFinish() {
    setBusy(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({
        gender,
        past_relationships: pastRelationships,
        breakup_reason: breakupReason,
        breakup_reason_other: breakupReason === 'other' ? breakupReasonOther.trim() : null,
        healing_stage: healingStage,
        onboarding_completed: true
      })
      .eq('id', user.id)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="wick text-candle text-3xl inline-block animate-flicker">🕯️</div>
          <h1 className="mt-3 text-2xl font-display">{t('onboarding.title')}</h1>
          <p className="mt-2 text-sm text-parchment-dim leading-relaxed">{t('onboarding.subtitle')}</p>
        </div>

        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < step ? 'bg-candle' : 'bg-ink-line'}`}
            />
          ))}
        </div>

        <div className="card p-6">
          <p className="text-xs text-parchment-dim font-mono mb-4">
            {t('onboarding.step')} {step} {t('onboarding.of')} {TOTAL_STEPS}
          </p>

          {step === 1 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg mb-3">{t('onboarding.gender.q')}</h2>
              <ChoiceButton selected={gender === 'male'} onClick={() => setGender('male')}>
                {t('onboarding.gender.male')}
              </ChoiceButton>
              <ChoiceButton selected={gender === 'female'} onClick={() => setGender('female')}>
                {t('onboarding.gender.female')}
              </ChoiceButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg mb-3">{t('onboarding.past.q')}</h2>
              {['first_time', 'two_to_three', 'many'].map((val) => (
                <ChoiceButton
                  key={val}
                  selected={pastRelationships === val}
                  onClick={() => setPastRelationships(val)}
                >
                  {t(`onboarding.past.${val}`)}
                </ChoiceButton>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg mb-3">{t('onboarding.reason.q')}</h2>
              {['infidelity', 'long_distance', 'miscommunication', 'family_financial', 'other'].map((val) => (
                <ChoiceButton
                  key={val}
                  selected={breakupReason === val}
                  onClick={() => setBreakupReason(val)}
                >
                  {t(`onboarding.reason.${val}`)}
                </ChoiceButton>
              ))}
              {breakupReason === 'other' && (
                <input
                  className="input mt-1"
                  placeholder={t('onboarding.reason.otherPlaceholder')}
                  value={breakupReasonOther}
                  onChange={(e) => setBreakupReasonOther(e.target.value)}
                  maxLength={100}
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg mb-3">{t('onboarding.healing.q')}</h2>
              {['fresh', 'moving_on', 'healed'].map((val) => (
                <ChoiceButton
                  key={val}
                  selected={healingStage === val}
                  onClick={() => setHealingStage(val)}
                >
                  {t(`onboarding.healing.${val}`)}
                </ChoiceButton>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

          <div className="flex items-center gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={goBack} className="btn-ghost">
                {t('onboarding.back')}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!stepValid || busy}
              className="btn-primary ml-auto"
            >
              {busy
                ? t('onboarding.saving')
                : step < TOTAL_STEPS
                ? t('onboarding.next')
                : t('onboarding.finish')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}