import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { LanguageSelect, MultiLanguageSelect } from '@/components/LanguageSelect'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile, ApiError } from '@/lib/api'

export function SettingsPage() {
  const { user } = useStore()
  const { refreshProfile } = useAuth()

  const [name, setName] = useState('')
  const [inputLang, setInputLang] = useState('ar')
  const [outputLangs, setOutputLangs] = useState<string[]>(['en'])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Settings
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Manage your profile and language preferences
          </p>
        </div>

        {/* Profile Settings */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
            Profile Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Slug (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                URL Slug
              </label>
              <div className="relative">
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
                  className="w-full pl-24 pr-4 py-3 rounded-xl cursor-not-allowed"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-dim)' }}>
                Slug cannot be changed after creation
              </p>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Display Name
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
              />
            </div>

            {/* Input Language */}
            <LanguageSelect
              id="inputLang"
              label="Speaking Language"
              value={inputLang}
              onChange={setInputLang}
            />

            {/* Output Languages */}
            <MultiLanguageSelect
              label="Translation Languages"
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
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                Settings saved successfully!
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span style={{ color: 'var(--color-text-muted)' }}>Account ID</span>
              <span
                className="text-sm font-mono"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {user?.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span style={{ color: 'var(--color-text-muted)' }}>Created</span>
              <span style={{ color: 'var(--color-text-dim)' }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
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

