import { useState } from 'react'
import { useCollections } from '@/hooks/useCollections'
import { useLanguage } from '@/hooks/useLanguage'
import { SessionCard } from '@/components/SessionCard'
import type { SessionListItem } from '@/types'

interface CollectionsListProps {
  sessions: SessionListItem[]
}

export function CollectionsList({ sessions }: CollectionsListProps) {
  const { t, dir } = useLanguage()
  const { collections, createCollection, deleteCollection, updateCollection, removeSessionFromCollection } = useCollections()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCollectionName.trim()) {
      createCollection(newCollectionName)
      setNewCollectionName('')
      setIsCreating(false)
    }
  }

  const handleUpdate = (id: string) => {
    if (editName.trim()) {
      updateCollection(id, { name: editName })
      setEditingCollectionId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.common.create_collection}
        </button>
      ) : (
        <form onSubmit={handleCreate} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder={t.common.collection_name}
              className="flex-1 px-3 py-2 rounded-lg"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newCollectionName.trim()}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            >
              {t.common.create}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Collections List */}
      {collections.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-muted)' }}>{t.common.no_collections}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>{t.common.create_first_collection}</p>
        </div>
      )}

      {collections.map((collection) => {
        const collectionSessions = sessions.filter(s => collection.session_ids.includes(s.id))
        const isExpanded = expandedCollectionId === collection.id
        const isEditing = editingCollectionId === collection.id

        return (
          <div
            key={collection.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setExpandedCollectionId(isExpanded ? null : collection.id)}
                  className="p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : (dir === 'rtl' ? 'rotate(180deg)' : 'none') }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded text-lg font-semibold"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(collection.id)} className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{t.common.save}</button>
                      <button onClick={() => setEditingCollectionId(null)} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.common.cancel}</button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{collection.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{collectionSessions.length} {t.common.items}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => {
                        setEditName(collection.name)
                        setEditingCollectionId(collection.id)
                      }}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-bg)]"
                      style={{ color: 'var(--color-text-muted)' }}
                      title={t.common.rename}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t.common.delete_collection_title + '\n' + t.common.delete_collection_body)) {
                          deleteCollection(collection.id)
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--color-danger-muted)]"
                      style={{ color: 'var(--color-danger)' }}
                      title={t.common.delete}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                {collectionSessions.length > 0 ? (
                  collectionSessions.map(session => (
                    <div key={session.id} className="relative group">
                      <SessionCard session={session} />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          removeSessionFromCollection(collection.id, session.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-[var(--color-danger)] text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        style={{ transform: 'translate(50%, -50%)' }}
                        title="Remove from collection"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-dim)' }}>
                    Empty collection
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

