import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { useLanguage } from '@/hooks/useLanguage'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { signOut } = useAuth()
  const { user } = useStore()
  const { t } = useLanguage()

  const navItems = [
    { path: '/dashboard', label: t.DashboardPage.title, icon: DashboardIcon },
    { path: '/history', label: t.HistoryPage.title, icon: HistoryIcon },
    { path: '/settings', label: t.SettingsPage.title, icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col fixed start-0 top-0 bottom-0"
        style={{ background: 'var(--color-bg-elevated)', borderInlineEnd: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
          >
            B
          </div>
          <div>
            <h1 className="font-semibold" style={{ color: 'var(--color-text)' }}>Baian</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.common.speaker_dashboard}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || 
              (path === '/history' && location.pathname.startsWith('/history'))
            
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors"
                style={{
                  background: isActive ? 'var(--color-bg-hover)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
              >
                <Icon />
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text)' }}
            >
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm" style={{ color: 'var(--color-text)' }}>
                {user?.name || 'Unknown'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                @{user?.slug || 'unknown'}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {t.common.sign_out}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ms-64 p-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

// Icons
function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
