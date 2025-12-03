import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { LanguageSelect, MultiLanguageSelect } from '@/components/LanguageSelect'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/hooks/useAuth'
import { useMicDevices } from '@/hooks/useMicDevices'
import { useLanguage } from '@/hooks/useLanguage'
import { updateProfile, ApiError } from '@/lib/api'

export function SettingsPage() {
  const { user } = useStore()
  const { refreshProfile } = useAuth()
  const { t, language } = useLanguage()

  const [name, setName] = useState('')
  const [inputLang, setInputLang] = useState('ar')
  const [outputLangs, setOutputLangs] = useState<string[]>(['en'])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    devices: micDevices,
    selectedId: selectedMicId,
    error: micError,
    refresh: refreshMicDevices,
    selectDevice: selectMic,
  } = useMicDevices()

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name)
      setInputLang(user.input_lang)
      setOutputLangs(user.output_langs)
    }
  }, [user])

  const hasChanges = user && (
    name !== user.name ||
    inputLang !== user.input_lang ||
    JSON.stringify(outputLangs.sort()) !== JSON.stringify([...user.output_langs].sort())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updateProfile({
        name: name.trim(),
        input_lang: inputLang,
        output_langs: outputLangs,
      })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (user) {
      setName(user.name)
      setInputLang(user.input_lang)
      setOutputLangs(user.output_langs)
      setError(null)
    }
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display mb-2" style={{ color: 'var(--color-text)' }}>
            {t.SettingsPage.title}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t.SettingsPage.subtitle}
          </p>
        </div>

        {/* Profile Settings */}
        <div
          className="rounded-3xl p-8 mb-6 shadow-baian"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-6 border-b border-baian-sand/20 pb-5" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold font-display tracking-wide" style={{ color: 'var(--color-text)' }}>
              {t.SettingsPage.section_profile}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Slug (read-only) */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                {t.SettingsPage.label_slug}
              </label>
              <div className="relative" dir="ltr">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  baian.app/
                </span>
                <input
                  type="text"
                  value={user?.slug || ''}
                  readOnly
                  className="w-full pl-24 pr-4 py-3.5 rounded-xl cursor-not-allowed text-sm"
                  style={{
                    background: 'var(--color-bg-inset)', // Using inset background
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--color-text-dim)',
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-dim)' }}>
                {t.SettingsPage.helper_slug_locked}
              </p>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {t.SettingsPage.label_displayName}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl transition-all focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] text-sm outline-none"
                style={{
                  background: 'var(--color-bg-inset)',
                  border: '1px solid rgba(255,255,255,0.1)', // border-baian-sand/40 equivalent
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Input Language */}
            <LanguageSelect
              id="inputLang"
              label={t.SettingsPage.label_speakingLang}
              value={inputLang}
              onChange={setInputLang}
            />

            {/* Output Languages */}
            <MultiLanguageSelect
              label={t.SettingsPage.label_translationLang}
              value={outputLangs}
              onChange={setOutputLangs}
              excludeLanguage={inputLang}
            />

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--color-live-muted)', color: 'var(--color-live)' }}
              >
                {t.SettingsPage.msg_success}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="px-8 py-3 rounded-2xl font-medium transition-colors disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'var(--color-accent)',
                  color: 'white', // Always white on accent
                }}
              >
                {loading ? t.common.loading : t.SettingsPage.button_save}
              </button>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-8 py-3 rounded-2xl font-medium transition-colors hover:bg-[var(--color-bg-hover)]"
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {t.SettingsPage.button_reset}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Microphone Settings */}
        <div
          className="rounded-3xl p-8 mb-6 shadow-baian"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-start justify-between mb-6 border-b border-baian-sand/20 pb-5" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <h2 className="text-lg font-semibold font-display tracking-wide" style={{ color: 'var(--color-text)' }}>
                {t.SettingsPage.section_mic}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {t.SettingsPage.subtitle_mic}
              </p>
            </div>
            <button
              onClick={refreshMicDevices}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-bg-hover)]"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              type="button"
            >
              {t.SettingsPage.button_refresh}
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedMicId}
              onChange={(e) => selectMic(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-sm appearance-none cursor-pointer hover:border-opacity-50 transition-colors"
              style={{
                background: 'var(--color-bg-inset)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text)',
              }}
              disabled={micDevices.length === 0}
            >
              {micDevices.length === 0 && <option value="">No microphones detected</option>}
              {micDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || 'Microphone'}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: 'var(--color-text-muted)' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {micError && (
            <div
              className="mt-3 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
            >
              {micError}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div
          className="rounded-3xl p-8 shadow-baian"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="mb-4 border-b border-baian-sand/20 pb-4" style={{ borderColor: 'var(--color-border)' }}>
             <h2 className="text-lg font-semibold font-display tracking-wide" style={{ color: 'var(--color-text)' }}>
              {t.SettingsPage.section_account}
            </h2>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
              <span className="font-medium text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.SettingsPage.label_account_id}</span>
              <span
                className="text-sm font-mono"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {user?.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
              <span className="font-medium text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.SettingsPage.label_created}</span>
              <span style={{ color: 'var(--color-text-dim)' }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString(language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
