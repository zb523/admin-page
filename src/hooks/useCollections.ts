import { useState, useEffect, useCallback } from 'react'
import type { Collection } from '@/types'

const COLLECTIONS_STORAGE_KEY = 'baian-collections'

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])

  // Load collections from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY)
      if (stored) {
        setCollections(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load collections', err)
    }
  }, [])

  // Save collections to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections))
    } catch (err) {
      console.error('Failed to save collections', err)
    }
  }, [collections])

  const createCollection = useCallback((name: string) => {
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      name: name.trim(),
      session_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCollections((prev) => [newCollection, ...prev])
    return newCollection
  }, [])

  const deleteCollection = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCollection = useCallback((id: string, updates: Partial<Pick<Collection, 'name'>>) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...updates, updated_at: new Date().toISOString() }
          : c
      )
    )
  }, [])

  const addSessionsToCollection = useCallback((collectionId: string, sessionIds: string[]) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== collectionId) return c
        
        // Add new IDs avoiding duplicates
        const newIds = new Set([...c.session_ids, ...sessionIds])
        return {
          ...c,
          session_ids: Array.from(newIds),
          updated_at: new Date().toISOString(),
        }
      })
    )
  }, [])

  const removeSessionFromCollection = useCallback((collectionId: string, sessionId: string) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== collectionId) return c
        return {
          ...c,
          session_ids: c.session_ids.filter((id) => id !== sessionId),
          updated_at: new Date().toISOString(),
        }
      })
    )
  }, [])

  // When a session is deleted globally, remove it from all collections
  const cleanupDeletedSessions = useCallback((deletedSessionIds: string[]) => {
    setCollections((prev) =>
      prev.map((c) => ({
        ...c,
        session_ids: c.session_ids.filter((id) => !deletedSessionIds.includes(id)),
      }))
    )
  }, [])

  return {
    collections,
    createCollection,
    deleteCollection,
    updateCollection,
    addSessionsToCollection,
    removeSessionFromCollection,
    cleanupDeletedSessions,
  }
}

