import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { SessionCard } from '@/components/SessionCard'
import { useSession } from '@/hooks/useSession'
import { deleteSession } from '@/lib/api'
import type { SessionListItem } from '@/types'

export function HistoryPage() {
  const { fetchSessions } = useSession()
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

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
    } catch (err) {
      console.error('Failed to delete session:', err)
      // Revert on failure - refetch
      const data = await fetchSessions()
      setSessions(data)
    } finally {
      setDeleting(null)
    }
  }

  const liveSessions = sessions.filter((s) => s.is_live)
  const pastSessions = sessions.filter((s) => !s.is_live)

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Session History
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            View and manage your past translation sessions
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : sessions.length === 0 ? (
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
              No sessions yet
            </h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Start your first session from the dashboard
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Sessions */}
            {liveSessions.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse-live"
                    style={{ background: 'var(--color-live)' }}
                  />
                  Live Now
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
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Past Sessions
                </h2>
                <div className="space-y-3">
                  {pastSessions.map((session) => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
