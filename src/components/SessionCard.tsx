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
      className="block p-5 rounded-xl transition-all group animate-fade-in"
      style={{
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        boxShadow: isSelected ? '0 0 0 1px var(--color-accent)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--color-border-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      <div className="flex items-start gap-4">
        {selectable && (
          <div className="flex items-center h-full pt-1">
            <div
              className="w-5 h-5 rounded border flex items-center justify-center transition-colors"
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

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {session.is_live && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse-live"
                    style={{ background: 'var(--color-live-muted)', color: 'var(--color-live)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-live)' }} />
                    {t.HistoryPage.chip_live}
                  </span>
                )}
                <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                  {session.title || t.common.untitled_session}
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
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {t.languages[session.input_lang as keyof typeof t.languages] || session.input_lang}
                </span>
                <span style={{ color: 'var(--color-text-dim)' }}>
                  {dir === 'rtl' ? '←' : '→'}
                </span>
                {session.output_langs.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'var(--color-bg-hover)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {t.languages[lang as keyof typeof t.languages] || lang}
                  </span>
                ))}
              </div>
            </div>
            
            {!selectable && (
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
                    title={t.common.delete}
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
                  style={{ color: 'var(--color-text-dim)', transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
