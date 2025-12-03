import { useState } from 'react'
import { useCollections } from '@/hooks/useCollections'
import { useLanguage } from '@/hooks/useLanguage'

interface AddToCollectionModalProps {
  selectedCount: number
  onConfirm: (collectionId: string) => void
  onCancel: () => void
}

export function AddToCollectionModal({ selectedCount, onConfirm, onCancel }: AddToCollectionModalProps) {
  const { t } = useLanguage()
  const { collections, createCollection } = useCollections()
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCollectionName.trim()) {
      const newCollection = createCollection(newCollectionName)
      onConfirm(newCollection.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md rounded-2xl p-6 animate-fade-in"
        style={{ 
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {t.common.add_to_collection}
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {t.common.add_to} {selectedCount} {t.common.items}...
        </p>
        
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => onConfirm(collection.id)}
              className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-[var(--color-bg-hover)] flex items-center justify-between group"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{collection.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {collection.session_ids.length} {t.common.items}
              </span>
            </button>
          ))}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="mt-4">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder={t.common.collection_name}
              className="w-full px-3 py-2 rounded-lg mb-2"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newCollectionName.trim()}
                className="flex-1 px-3 py-2 rounded-lg font-medium text-sm"
                style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                {t.common.create}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-3 py-2 rounded-lg font-medium text-sm"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        ) : (
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
        )}

        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bg-hover)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

