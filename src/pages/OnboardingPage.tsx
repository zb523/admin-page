import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProfile, ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSelect, MultiLanguageSelect } from '@/components/LanguageSelect'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const { t } = useLanguage()

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [inputLang, setInputLang] = useState('ar')
  const [outputLangs, setOutputLangs] = useState(['en'])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Slug validation: lowercase, alphanumeric + hyphens, 3-30 chars
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/
  const isSlugValid = slugRegex.test(slug)

  const formatSlug = (value: string) => {
    // Convert to lowercase, replace spaces with hyphens, remove invalid chars
    return value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSlugValid) {
      setError('Slug must be 3-30 characters, lowercase alphanumeric with hyphens, cannot start/end with hyphen')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await createProfile({
        slug,
        name: name.trim(),
        input_lang: inputLang,
        output_langs: outputLangs,
      })

      // Refresh profile in store and navigate
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('This slug is already taken. Please choose another.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to create profile')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--color-text)' }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t.OnboardingPage.heading_profile}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t.OnboardingPage.subtitle_profile}
          </p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t.OnboardingPage.label_displayName}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="Your Name"
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t.OnboardingPage.label_slug}
              </label>
              <div className="relative" dir="ltr">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  baian.app/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(formatSlug(e.target.value))}
                  required
                  className="w-full pl-24 pr-4 py-3 rounded-xl transition-colors"
                  style={{
                    background: 'var(--color-bg)',
                    border: `1px solid ${slug && !isSlugValid ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    color: 'var(--color-text)',
                  }}
                  placeholder="your-mosque"
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-dim)' }}>
                {t.OnboardingPage.helper_slug}
              </p>
            </div>

            {/* Input Language */}
            <LanguageSelect
              id="inputLang"
              label={t.OnboardingPage.label_speakingLang}
              value={inputLang}
              onChange={setInputLang}
            />

            {/* Output Languages */}
            <MultiLanguageSelect
              label={t.OnboardingPage.label_translationLang}
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

            <button
              type="submit"
              disabled={loading || !isSlugValid || !name.trim()}
              className="w-full px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
              }}
            >
              {loading ? t.common.loading : t.OnboardingPage.button_complete}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
