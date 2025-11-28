import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type AuthMode = 'signin' | 'signup'

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        setMessage('Check your email to confirm your account')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, var(--color-accent) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, var(--color-accent) 0%, transparent 50%)`,
          filter: 'blur(100px)',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
          >
            B
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Baian
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Real-time translation for speakers
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </h2>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors mb-6"
            style={{
              background: 'white',
              color: '#1f2937',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-dim)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
              }}
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setMessage(null)
              }}
              className="font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

