import { create } from 'zustand'
import type { Room } from 'livekit-client'
import type { UserProfile, Session } from '@/types'

// Session phase - persisted in Zustand to survive navigation
export type SessionPhase = 'idle' | 'connecting' | 'waiting_agent' | 'live' | 'agent_reconnecting'

interface AppState {
  // Auth state
  user: UserProfile | null
  isAuthLoading: boolean
  needsOnboarding: boolean

  // Session state
  activeSession: Session | null
  sessionPhase: SessionPhase
  isLive: boolean
  livekitRoom: Room | null
  isMicEnabled: boolean

  // Auth actions
  setUser: (user: UserProfile | null) => void
  setAuthLoading: (loading: boolean) => void
  setNeedsOnboarding: (needs: boolean) => void
  
  // Session actions
  setActiveSession: (session: Session | null) => void
  setSessionPhase: (phase: SessionPhase) => void
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
  sessionPhase: 'idle' as SessionPhase,
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
  setSessionPhase: (sessionPhase) => set({ sessionPhase }),
  setIsLive: (isLive) => set({ isLive }),
  setLivekitRoom: (livekitRoom) => set({ livekitRoom }),
  setMicEnabled: (isMicEnabled) => set({ isMicEnabled }),

  // Compound actions
  startLiveSession: (session, room) => {
    set({
      activeSession: session,
      sessionPhase: 'live',
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
      sessionPhase: 'idle',
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
