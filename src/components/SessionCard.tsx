import { Link } from 'react-router-dom'
import type { SessionListItem } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

interface SessionCardProps {
  session: SessionListItem
  onDelete?: (sessionId: string) => void
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress'
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(session.id)
    }
  }

  return (
    <Link
      to={`/history/${session.id}`}
      className="block p-5 rounded-xl transition-all group animate-fade-in"
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {session.is_live && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse-live"
                style={{ background: 'var(--color-danger-muted)', color: 'var(--color-live)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-live)' }} />
                LIVE
              </span>
            )}
            <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {session.title || 'Untitled Session'}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span>{formatDate(session.created_at)}</span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span>{formatDuration(session.created_at, session.ended_at)}</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
            >
              {SUPPORTED_LANGUAGES[session.input_lang] || session.input_lang}
            </span>
            <span style={{ color: 'var(--color-text-dim)' }}>→</span>
            {session.output_langs.map((lang) => (
              <span
                key={lang}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                {SUPPORTED_LANGUAGES[lang] || lang}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Delete button - visible on hover */}
          {onDelete && !session.is_live && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all hover:scale-110"
              style={{ 
                color: 'var(--color-danger)',
                background: 'var(--color-danger-muted)',
              }}
              title="Delete session"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
          
          {/* Arrow icon */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text-dim)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
