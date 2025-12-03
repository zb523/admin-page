import { useStore } from '@/store/useStore'
import { useLanguage } from '@/hooks/useLanguage'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthLoading } = useStore()
  const { t } = useLanguage()

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>{t.AuthGuard.loading}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
