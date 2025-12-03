import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import type { SessionListItem } from '@/types'

interface SessionCardProps {
  session: SessionListItem
  onDelete?: (sessionId: string) => void
  selectable?: boolean
  isSelected?: boolean
  onToggle?: (sessionId: string) => void
}

export function SessionCard({ session, onDelete, selectable, isSelected, onToggle }: SessionCardProps) {
  const { t, language, dir } = useLanguage()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(language, {
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectable && onToggle) {
      e.preventDefault()
      onToggle(session.id)
    }
  }

  return (
    <Link
      to={`/history/${session.id}`}
      onClick={handleCardClick}
      className="block p-4 transition-all group animate-fade-in"
      style={{
        background: isSelected ? 'var(--color-bg-elevated)' : 'transparent',
        borderRadius: '16px', // rounded-2xl for row hover
        border: isSelected ? '1px solid var(--color-accent)' : '1px solid transparent',
        borderBottom: !isSelected ? '1px solid rgba(255,255,255,0.03)' : '1px solid var(--color-accent)', // Subtle divider
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--color-bg-elevated)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <div className="flex items-center gap-4">
        {selectable && (
          <div className="flex items-center">
            <div
              className="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
              style={{
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                background: isSelected ? 'var(--color-accent)' : 'transparent',
              }}
            >
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Title & Date (Col 1-6) */}
          <div className="md:col-span-6 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {session.is_live && (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse-live"
                  style={{ background: 'var(--color-live-muted)', color: 'var(--color-live)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-live)' }} />
                  LIVE
                </span>
              )}
              <h3 className="font-medium truncate text-base" style={{ color: 'var(--color-text)' }}>
                {session.title || t.common.untitled_session}
              </h3>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(session.created_at)}
            </div>
          </div>

          {/* Duration (Col 7-9) */}
          <div className="md:col-span-3 text-sm font-mono" style={{ color: 'var(--color-text-dim)' }}>
            {formatDuration(session.created_at, session.ended_at)}
          </div>

          {/* Languages (Col 10-12) */}
          <div className="md:col-span-3 flex items-center gap-1.5">
             <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  background: 'var(--color-bg-inset)',
                  color: 'var(--color-text)',
                }}
              >
                {t.languages[session.input_lang as keyof typeof t.languages] || session.input_lang}
              </span>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '10px' }}>
                {dir === 'rtl' ? '←' : '→'}
              </span>
              <div className="flex -space-x-1 rtl:space-x-reverse overflow-hidden">
                {session.output_langs.slice(0, 3).map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-1 rounded text-xs font-medium relative"
                    style={{
                      background: 'var(--color-bg-inset)',
                      color: 'var(--color-text)',
                      borderLeft: '1px solid var(--color-bg-elevated)'
                    }}
                  >
                    {t.languages[lang as keyof typeof t.languages] || lang}
                  </span>
                ))}
                {session.output_langs.length > 3 && (
                  <span className="px-1 py-1 text-xs text-[var(--color-text-muted)]">+{session.output_langs.length - 3}</span>
                )}
              </div>
          </div>
        </div>
        
        {!selectable && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Delete button - visible on hover */}
            {onDelete && !session.is_live && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{ 
                  color: 'var(--color-danger)',
                  background: 'var(--color-danger-muted)',
                }}
                title={t.common.delete}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
            
            <div
              style={{ color: 'var(--color-text-dim)', transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
