import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { getSessionHistory, updateSession, deleteSession, ApiError } from '@/lib/api'
import { useLanguage } from '@/hooks/useLanguage'
import type { SessionHistoryResponse } from '@/types'

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, language, dir } = useLanguage()
  
  const [data, setData] = useState<SessionHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const result = await getSessionHistory(id)
        setData(result)
        setTitleInput(result.session.title || '')
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to load session')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSaveTitle = async () => {
    if (!id || !data) return
    setIsSavingTitle(true)
    try {
      await updateSession(id, { title: titleInput.trim() || undefined })
      setData({
        ...data,
        session: { ...data.session, title: titleInput.trim() || null },
      })
      setIsEditingTitle(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteSession(id)
      navigate('/history', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return t.common.in_progress
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} ${t.common.minutes}`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}${t.common.hour_short} ${mins}${t.common.min_short}`
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="animate-fade-in">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t.HistoryDetailPage.back_link}
          </Link>
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ color: 'var(--color-danger)' }}>{error || t.HistoryDetailPage.error_not_found}</p>
          </div>
        </div>
      </Layout>
    )
  }

  const { session, transcripts } = data

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Back link */}
        <Link
          to="/history"
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t.HistoryDetailPage.back_link}
        </Link>

        {/* Session Header */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-lg font-semibold"
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    placeholder={t.HistoryDetailPage.label_title}
                    autoFocus
                    dir="auto"
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={isSavingTitle}
                    className="px-3 py-2 rounded-lg font-medium text-sm"
                    style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                  >
                    {isSavingTitle ? t.common.loading : t.common.save}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false)
                      setTitleInput(session.title || '')
                    }}
                    className="px-3 py-2 rounded-lg font-medium text-sm"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                  >
                    {t.common.cancel}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {session.is_live && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse-live"
                      style={{ background: 'var(--color-live-muted)', color: 'var(--color-live)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-live)' }} />
                      {t.HistoryPage.chip_live}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {session.title || t.common.untitled_session}
                  </h1>
                  {!session.is_live && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {!session.is_live && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{
                  background: 'var(--color-danger-muted)',
                  color: 'var(--color-danger)',
                }}
              >
                {t.common.delete}
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-dim)' }}>{t.HistoryDetailPage.label_started}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {formatDate(session.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-dim)' }}>{t.HistoryDetailPage.label_duration}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {formatDuration(session.created_at, session.ended_at)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-dim)' }}>{t.HistoryDetailPage.label_speaking}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t.languages[session.input_lang as keyof typeof t.languages] || session.input_lang}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-dim)' }}>{t.HistoryDetailPage.label_translations}</p>
              <div className="flex flex-wrap gap-1">
                {session.output_langs.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded text-xs font-medium"
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
          </div>
        </div>

        {/* Transcripts */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            {t.HistoryDetailPage.section_transcripts} ({transcripts.length})
          </h2>

          {transcripts.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t.HistoryDetailPage.empty_transcripts}</p>
          ) : (
            <div className="space-y-4">
              {transcripts.map((transcript) => (
                <div
                  key={transcript.sequence_id}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-dim)' }}
                    >
                      #{transcript.sequence_id}
                    </span>
                  </div>
                  <p className="mb-3 text-lg" style={{ color: 'var(--color-text)' }} dir="auto">
                    {transcript.source_text}
                  </p>
                  {Object.entries(transcript.translations).length > 0 && (
                    <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      {Object.entries(transcript.translations).map(([lang, text]) => (
                        <div key={lang} className="flex gap-3">
                          <span
                            className="shrink-0 text-xs font-medium px-2 py-0.5 rounded h-fit"
                            style={{
                              background: 'var(--color-bg-hover)',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {t.languages[lang as keyof typeof t.languages] || lang}
                          </span>
                          <p style={{ color: 'var(--color-text-muted)' }} dir="auto">{text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div
              className="w-full max-w-md rounded-2xl p-6 animate-fade-in"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                {t.HistoryDetailPage.modal_delete_title}
              </h3>
              <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {t.HistoryDetailPage.modal_delete_body}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                >
                  {isDeleting ? t.common.loading : t.common.delete}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
