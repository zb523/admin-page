import { create } from 'zustand'
import type { Room } from 'livekit-client'
import type { UserProfile, Session } from '@/types'

interface AppState {
  // Auth state
  user: UserProfile | null
  isAuthLoading: boolean
  needsOnboarding: boolean

  // Session state
  activeSession: Session | null
  isLive: boolean
  livekitRoom: Room | null
  isMicEnabled: boolean

  // Auth actions
  setUser: (user: UserProfile | null) => void
  setAuthLoading: (loading: boolean) => void
  setNeedsOnboarding: (needs: boolean) => void
  
  // Session actions
  setActiveSession: (session: Session | null) => void
  setIsLive: (live: boolean) => void
  setLivekitRoom: (room: Room | null) => void
  setMicEnabled: (enabled: boolean) => void

  // Compound actions
  startLiveSession: (session: Session, room: Room) => void
  stopLiveSession: () => void
  resetAuth: () => void
}

const initialAuthState = {
  user: null,
  isAuthLoading: true,
  needsOnboarding: false,
}

const initialSessionState = {
  activeSession: null,
  isLive: false,
  livekitRoom: null,
  isMicEnabled: false,
}

export const useStore = create<AppState>((set, get) => ({
  ...initialAuthState,
  ...initialSessionState,

  // Auth actions (simple setters)
  setUser: (user) => set({ user }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),

  // Session actions
  setActiveSession: (activeSession) => set({ activeSession }),
  setIsLive: (isLive) => set({ isLive }),
  setLivekitRoom: (livekitRoom) => set({ livekitRoom }),
  setMicEnabled: (isMicEnabled) => set({ isMicEnabled }),

  // Compound actions
  startLiveSession: (session, room) => {
    set({
      activeSession: session,
      isLive: true,
      livekitRoom: room,
      isMicEnabled: true,
    })
    // Also update user's is_live status locally
    const { user } = get()
    if (user) {
      set({
        user: {
          ...user,
          is_live: true,
          current_room_name: session.room_name,
        },
      })
    }
  },

  stopLiveSession: () => {
    const { livekitRoom, user } = get()
    
    // Disconnect room if connected
    if (livekitRoom) {
      livekitRoom.disconnect()
    }

    set({
      activeSession: null,
      isLive: false,
      livekitRoom: null,
      isMicEnabled: false,
    })

    // Update user's is_live status locally
    if (user) {
      set({
        user: {
          ...user,
          is_live: false,
          current_room_name: null,
        },
      })
    }
  },

  // Reset auth state (called on sign out)
  resetAuth: () => {
    const { livekitRoom } = get()
    if (livekitRoom) {
      livekitRoom.disconnect()
    }
    set({
      ...initialAuthState,
      ...initialSessionState,
      isAuthLoading: false, // Not loading after reset
    })
  },
}))
