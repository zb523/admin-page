import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { SessionCard } from '@/components/SessionCard'
import { CollectionsList } from '@/components/CollectionsList'
import { AddToCollectionModal } from '@/components/AddToCollectionModal'
import { useSession } from '@/hooks/useSession'
import { useLanguage } from '@/hooks/useLanguage'
import { useCollections } from '@/hooks/useCollections'
import { deleteSession } from '@/lib/api'
import type { SessionListItem } from '@/types'

export function HistoryPage() {
  const { fetchSessions } = useSession()
  const { t, dir } = useLanguage()
  const { addSessionsToCollection, cleanupDeletedSessions } = useCollections()
  
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false)
  
  // Selection Mode State
  const [activeTab, setActiveTab] = useState<'sessions' | 'collections'>('sessions')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
  
  // Modal State
  const [showAddToCollection, setShowAddToCollection] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchSessions()
      setSessions(data)
      setLoading(false)
    }
    load()
  }, [fetchSessions])

  const handleDelete = async (sessionId: string) => {
    if (deleting) return // Prevent multiple deletes

    // Optimistic removal
    setDeleting(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    try {
      await deleteSession(sessionId)
      cleanupDeletedSessions([sessionId])
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
      cleanupDeletedSessions(idsToDelete)
    } catch (err) {
      console.error('Failed to delete sessions:', err)
      // Revert - refetch
      const data = await fetchSessions()
      setSessions(data)
    } finally {
      setIsDeletingMultiple(false)
    }
  }

  const handleAddToCollection = (collectionId: string) => {
    addSessionsToCollection(collectionId, Array.from(selectedSessionIds))
    setShowAddToCollection(false)
    setSelectedSessionIds(new Set())
    setIsSelectionMode(false)
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {t.HistoryPage.title}
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {t.HistoryPage.subtitle}
            </p>
          </div>

          {/* Tabs & Actions */}
          <div className="flex items-center gap-3">
            <div 
              className="p-1 rounded-lg flex" 
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => { setActiveTab('sessions'); setIsSelectionMode(false); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'sessions' 
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t.common.sessions}
              </button>
              <button
                onClick={() => { setActiveTab('collections'); setIsSelectionMode(false); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'collections' 
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t.common.collections}
              </button>
            </div>

            {activeTab === 'sessions' && pastSessions.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode)
                  setSelectedSessionIds(new Set())
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  isSelectionMode 
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)] border-transparent'
                    : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
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
            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <>
                {sessions.length === 0 ? (
                  <div
                    className="rounded-2xl p-12 text-center"
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
                          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
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
                        <div className="space-y-3">
                          {pastSessions.map((session) => (
                            <SessionCard 
                              key={session.id} 
                              session={session} 
                              onDelete={isSelectionMode ? undefined : handleDelete}
                              selectable={isSelectionMode}
                              isSelected={selectedSessionIds.has(session.id)}
                              onToggle={toggleSelection}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <CollectionsList sessions={sessions} />
            )}
          </>
        )}

        {/* Sticky Action Bar */}
        {isSelectionMode && selectedSessionIds.size > 0 && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50">
            <div 
              className="pointer-events-auto rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-slide-up"
              style={{ 
                background: 'var(--color-bg-elevated)', 
                border: '1px solid var(--color-border)',
                maxWidth: '90vw'
              }}
            >
              <div className="px-4 font-medium" style={{ color: 'var(--color-text)' }}>
                {selectedSessionIds.size} {t.common.selected}
              </div>
              <div className="h-6 w-px" style={{ background: 'var(--color-border)' }} />
              <button
                onClick={() => setShowAddToCollection(true)}
                className="px-4 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--color-bg-hover)]"
                style={{ color: 'var(--color-text)' }}
              >
                {t.common.add_to_collection}
              </button>
              <button
                onClick={handleMassDelete}
                className="px-4 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--color-danger-muted)]"
                style={{ color: 'var(--color-danger)' }}
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        )}

        {/* Add to Collection Modal */}
        {showAddToCollection && (
          <AddToCollectionModal
            selectedCount={selectedSessionIds.size}
            onConfirm={handleAddToCollection}
            onCancel={() => setShowAddToCollection(false)}
          />
        )}
      </div>
    </Layout>
  )
}
