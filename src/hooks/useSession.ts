import { useCallback, useState, useRef } from 'react'
import { useStore } from '@/store/useStore'
import {
  startSession as apiStartSession,
  stopSession as apiStopSession,
  getMySessions,
  ApiError,
} from '@/lib/api'
import {
  connectToRoom,
  enableMicrophone,
  disconnectRoom,
  toggleMicrophone as toggleMic,
  getRemoteParticipants,
  isAgentParticipant,
} from '@/lib/livekit'
import type { Room } from 'livekit-client'
import type { Session, SessionListItem } from '@/types'

export type SessionPhase = 'idle' | 'connecting' | 'waiting_agent' | 'live' | 'agent_reconnecting'

export function useSession() {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForceStopModal, setShowForceStopModal] = useState(false)
  
  // Store the room reference for callbacks
  const roomRef = useRef<Room | null>(null)

  const {
    user,
    activeSession,
    livekitRoom,
    isMicEnabled,
    startLiveSession,
    stopLiveSession,
    setMicEnabled,
  } = useStore()

  // Start a new session
  const startSession = useCallback(async () => {
    if (!user) {
      setError('Not logged in')
      return
    }

    setSessionPhase('connecting')
    setError(null)

    try {
      const response = await apiStartSession()

      // Connect to LiveKit room with participant callbacks
      const room = await connectToRoom(response.token, {
        onParticipantConnected: (participant) => {
          if (isAgentParticipant(participant)) {
            console.log('[useSession] Agent joined:', participant.identity)
            setSessionPhase('live')
            // Enable mic when agent joins
            if (roomRef.current) {
              enableMicrophone(roomRef.current).catch(console.error)
            }
          }
        },
        onParticipantDisconnected: (participant) => {
          if (isAgentParticipant(participant)) {
            console.log('[useSession] Agent disconnected:', participant.identity)
            setSessionPhase('agent_reconnecting')
          }
        },
        onDisconnected: (reason) => {
          console.log('Room disconnected:', reason)
        },
        onError: (err) => {
          console.error('Room error:', err)
          setError(err.message)
        },
      })

      // Store room reference for callbacks
      roomRef.current = room

      // Check if agent is already in room (using ParticipantKind.AGENT)
      const agentPresent = getRemoteParticipants(room).some(isAgentParticipant)
      
      if (agentPresent) {
        console.log('[useSession] Agent already in room')
        setSessionPhase('live')
        await enableMicrophone(room)
      } else {
        console.log('[useSession] Waiting for agent to join...')
        setSessionPhase('waiting_agent')
        // Don't enable mic until agent joins
      }

      // Create session object
      const session: Session = {
        id: response.session_id,
        room_name: response.room_name,
        title: null,
        input_lang: user.input_lang,
        output_langs: user.output_langs,
        is_live: true,
        created_at: new Date().toISOString(),
        ended_at: null,
      }

      startLiveSession(session, room)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.data?.session_id) {
          // Already have an active session - show modal
          setShowForceStopModal(true)
          setSessionPhase('idle')
          return
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to start session')
      }
      console.error('Start session error:', err)
      setSessionPhase('idle')
    }
  }, [user, startLiveSession])

  // Force stop existing session and start new
  const forceStopAndRestart = useCallback(async () => {
    setShowForceStopModal(false)
    setError(null)
    
    try {
      // Stop the existing session
      await apiStopSession()
      // Now start a new one
      await startSession()
    } catch (err) {
      console.error('Force stop and restart error:', err)
      setError('Failed to stop existing session')
      setSessionPhase('idle')
    }
  }, [startSession])

  // Stop current session
  const stopSession = useCallback(async () => {
    if (!activeSession && sessionPhase === 'idle') {
      setError('No active session')
      return
    }

    setIsStopping(true)
    setError(null)

    try {
      // Disconnect LiveKit first
      if (livekitRoom) {
        await disconnectRoom(livekitRoom)
      }
      roomRef.current = null

      // Then stop on server
      await apiStopSession()

      stopLiveSession()
      setSessionPhase('idle')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to stop session')
      }
      console.error('Stop session error:', err)
    } finally {
      setIsStopping(false)
    }
  }, [activeSession, sessionPhase, livekitRoom, stopLiveSession])

  // Cancel waiting (stop session while waiting for agent)
  const cancelSession = useCallback(async () => {
    await stopSession()
  }, [stopSession])

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!livekitRoom) return

    try {
      const enabled = await toggleMic(livekitRoom)
      setMicEnabled(enabled)
    } catch (err) {
      console.error('Toggle mic error:', err)
      setError('Failed to toggle microphone')
    }
  }, [livekitRoom, setMicEnabled])

  // Fetch session history
  const fetchSessions = useCallback(async (): Promise<SessionListItem[]> => {
    try {
      const response = await getMySessions()
      return response.sessions
    } catch (err) {
      console.error('Fetch sessions error:', err)
      return []
    }
  }, [])

  // Generate shareable listener link
  const getListenerLink = useCallback(() => {
    if (!user) return null
    return `https://listen.baian.app/${user.slug}`
  }, [user])

  // Dismiss force stop modal
  const dismissForceStopModal = useCallback(() => {
    setShowForceStopModal(false)
  }, [])

  return {
    // Session state
    activeSession,
    sessionPhase,
    isLive: sessionPhase === 'live',
    isMicEnabled,
    isStopping,
    error,
    
    // Modal state
    showForceStopModal,
    
    // Actions
    startSession,
    stopSession,
    cancelSession,
    forceStopAndRestart,
    dismissForceStopModal,
    toggleMicrophone,
    fetchSessions,
    getListenerLink,
    clearError: () => setError(null),
  }
}
