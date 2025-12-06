import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { SessionCard } from '@/components/SessionCard'
import { useSession } from '@/hooks/useSession'
import { useLanguage } from '@/hooks/useLanguage'
import { deleteSession, updateSession } from '@/lib/api'
import type { SessionListItem } from '@/types'

export function HistoryPage() {
  const { fetchSessions } = useSession()
  const { t } = useLanguage()
  
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false)
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchSessions()
      setSessions(data)
      setLoading(false)
    }
    load()
  }, [fetchSessions])

  const handleStartEdit = (session: SessionListItem) => {
    setEditingId(session.id)
    setEditTitle(session.title || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleSaveEdit = async (sessionId: string) => {
    if (!editTitle.trim()) return
    
    setIsSaving(true)
    try {
      const updatedSession = await updateSession(sessionId, { title: editTitle.trim() })
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: updatedSession.title } : s
      ))
      
      setEditingId(null)
      setEditTitle('')
    } catch (err) {
      console.error('Failed to update session title:', err)
      alert('Failed to update title. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (deleting) return // Prevent multiple deletes

    // Optimistic removal
    setDeleting(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    try {
      await deleteSession(sessionId)
    } catch (err) {
      console.error('Failed to delete session:', err)
      // Revert on failure - refetch
      const data = await fetchSessions()
      setSessions(data)
    } finally {
      setDeleting(null)
    }
  }

  const handleMassDelete = async () => {
    if (isDeletingMultiple || selectedSessionIds.size === 0) return
    
    if (!confirm(`Delete ${selectedSessionIds.size} sessions? This cannot be undone.`)) return

    setIsDeletingMultiple(true)
    const idsToDelete = Array.from(selectedSessionIds)
    
    // Optimistic removal
    setSessions((prev) => prev.filter((s) => !selectedSessionIds.has(s.id)))
    setSelectedSessionIds(new Set())
    setIsSelectionMode(false)

    try {
      await Promise.all(idsToDelete.map(id => deleteSession(id)))
    } catch (err) {
      console.error('Failed to delete sessions:', err)
      // Revert - refetch
      const data = await fetchSessions()
      setSessions(data)
    } finally {
      setIsDeletingMultiple(false)
    }
  }

  const toggleSelection = (sessionId: string) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const toggleSelectAll = (items: SessionListItem[]) => {
    if (selectedSessionIds.size === items.length) {
      setSelectedSessionIds(new Set())
    } else {
      setSelectedSessionIds(new Set(items.map(s => s.id)))
    }
  }

  const liveSessions = sessions.filter((s) => s.is_live)
  const pastSessions = sessions.filter((s) => !s.is_live)

  return (
    <Layout>
      <div className="animate-fade-in pb-24">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--color-text)' }}>
              {t.HistoryPage.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.HistoryPage.subtitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {pastSessions.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode)
                  setSelectedSessionIds(new Set())
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
                  isSelectionMode 
                    ? 'bg-[var(--color-accent)] text-white border-transparent'
                    : 'bg-transparent text-[var(--color-text)] border-[var(--color-border)]'
                }`}
              >
                {isSelectionMode ? t.common.cancel : t.common.select}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <div
                className="rounded-3xl p-12 text-center"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--color-bg)' }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  {t.HistoryPage.empty_title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {t.HistoryPage.empty_subtitle}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Live Sessions (Always unselectable) */}
                {liveSessions.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <span
                        className="w-2 h-2 rounded-full animate-pulse-live"
                        style={{ background: 'var(--color-live)' }}
                      />
                      {t.HistoryPage.section_live}
                    </h2>
                    <div className="space-y-3">
                      {liveSessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Past Sessions */}
                {pastSessions.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--color-text)' }}>
                        {t.HistoryPage.section_past}
                      </h2>
                      {isSelectionMode && (
                        <button
                          onClick={() => toggleSelectAll(pastSessions)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          {selectedSessionIds.size === pastSessions.length ? t.common.deselect_all : t.common.select_all}
                        </button>
                      )}
                    </div>
                    {/* Ghost Table Style - Minimal dividers */}
                    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[2rem] overflow-hidden shadow-baian">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-bg-inset)] border-b border-[var(--color-border)]">
                          <tr>
                            <th className="px-6 py-4 font-semibold text-[var(--color-text-muted)]">Date</th>
                            <th className="px-6 py-4 font-semibold text-[var(--color-text-muted)]">Event Title</th>
                            <th className="px-6 py-4 font-semibold text-[var(--color-text-muted)]">Duration</th>
                            <th className="px-6 py-4 font-semibold text-[var(--color-text-muted)] text-right">Listeners</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {pastSessions.map((session) => {
                            const isEditing = editingId === session.id
                            
                            return (
                              <tr key={session.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                                <td className="px-6 py-4 text-[var(--color-text)] opacity-80">
                                  {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 font-medium text-[var(--color-text)]">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if(e.key === 'Enter') handleSaveEdit(session.id)
                                          if(e.key === 'Escape') handleCancelEdit()
                                        }}
                                      />
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => handleSaveEdit(session.id)}
                                          disabled={isSaving}
                                          className="p-1.5 rounded-md text-[var(--color-live)] hover:bg-[var(--color-live-muted)] transition-colors"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button 
                                          onClick={handleCancelEdit}
                                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    session.title || t.common.untitled_session
                                  )}
                                </td>
                                <td className="px-6 py-4 text-[var(--color-text-muted)] font-mono text-xs">
                                  {session.ended_at ? (
                                    (() => {
                                      const diff = new Date(session.ended_at).getTime() - new Date(session.created_at).getTime()
                                      const mins = Math.floor(diff / 60000)
                                      return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`
                                    })()
                                  ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-[var(--color-text-muted)] font-mono text-xs text-right">
                                  -
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {!isEditing && (
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {/* Edit Button */}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEdit(session)
                                        }}
                                        className="p-2 rounded-lg text-[var(--color-accent)] hover:bg-[var(--color-bg)] transition-colors"
                                        title="Edit Name"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                        </svg>
                                      </button>
                                      
                                      {/* Delete Button */}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if(!isSelectionMode) handleDelete(session.id);
                                          else toggleSelection(session.id);
                                        }}
                                        className="p-2 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                                        title="Delete"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M3 6h18" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Sticky Action Bar */}
        {isSelectionMode && selectedSessionIds.size > 0 && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50">
            <div 
              className="pointer-events-auto rounded-full shadow-baian p-2 px-3 flex items-center gap-3 animate-slide-up backdrop-blur-lg"
              style={{ 
                background: 'var(--color-bg-elevated)', 
                border: '1px solid var(--color-border)',
                maxWidth: '90vw'
              }}
            >
              <div className="px-3 font-medium" style={{ color: 'var(--color-text)' }}>
                {selectedSessionIds.size} {t.common.selected}
              </div>
              <div className="h-6 w-px" style={{ background: 'var(--color-border)' }} />
              <button
                onClick={handleMassDelete}
                className="px-4 py-2 rounded-full font-medium transition-colors hover:bg-[var(--color-danger-muted)]"
                style={{ color: 'var(--color-danger)' }}
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
