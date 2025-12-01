import { Room, RoomEvent, ConnectionState, Track, RemoteParticipant, ParticipantKind } from 'livekit-client'

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL

if (!LIVEKIT_URL) {
  throw new Error('Missing VITE_LIVEKIT_URL environment variable')
}

export interface LiveKitCallbacks {
  onConnected?: () => void
  onDisconnected?: (reason?: string) => void
  onParticipantConnected?: (participant: RemoteParticipant) => void
  onParticipantDisconnected?: (participant: RemoteParticipant) => void
  onError?: (error: Error) => void
  onConnectionStateChange?: (state: ConnectionState) => void
}

export async function connectToRoom(
  token: string,
  callbacks?: LiveKitCallbacks
): Promise<Room> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  // Set up event listeners
  room.on(RoomEvent.Connected, () => {
    console.log('[LiveKit] Connected to room:', room.name)
    callbacks?.onConnected?.()
  })

  room.on(RoomEvent.Disconnected, (reason) => {
    console.log('[LiveKit] Disconnected:', reason)
    callbacks?.onDisconnected?.(reason?.toString())
  })

  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    console.log('[LiveKit] Connection state:', state)
    callbacks?.onConnectionStateChange?.(state)
  })

  room.on(RoomEvent.MediaDevicesError, (error) => {
    console.error('[LiveKit] Media devices error:', error)
    callbacks?.onError?.(error as Error)
  })

  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('[LiveKit] Participant connected:', participant.identity)
    callbacks?.onParticipantConnected?.(participant)
  })

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('[LiveKit] Participant disconnected:', participant.identity)
    callbacks?.onParticipantDisconnected?.(participant)
  })

  // Connect to the room with timeout
  try {
    await room.connect(LIVEKIT_URL, token, {
      // Fail faster on connection issues (default retries take forever)
      peerConnectionTimeout: 15_000, // 15 seconds
    })
  } catch (err) {
    // Clean up on failure
    room.disconnect()
    throw new Error(`Failed to connect to LiveKit: ${(err as Error).message}`)
  }

  return room
}

export async function enableMicrophone(room: Room): Promise<void> {
  await room.localParticipant.setMicrophoneEnabled(true)
  console.log('[LiveKit] Microphone enabled')
}

export async function disableMicrophone(room: Room): Promise<void> {
  await room.localParticipant.setMicrophoneEnabled(false)
  console.log('[LiveKit] Microphone disabled')
}

export async function disconnectRoom(room: Room): Promise<void> {
  await room.disconnect()
  console.log('[LiveKit] Room disconnected')
}

// Get microphone mute status
export function isMicrophoneMuted(room: Room): boolean {
  const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
  return micPub?.isMuted ?? true
}

// Toggle microphone
export async function toggleMicrophone(room: Room): Promise<boolean> {
  const currentlyEnabled = !isMicrophoneMuted(room)
  await room.localParticipant.setMicrophoneEnabled(!currentlyEnabled)
  return !currentlyEnabled
}

// Switch active microphone device
export async function setAudioInputDevice(room: Room, deviceId: string): Promise<void> {
  await room.switchActiveDevice('audioinput', deviceId)
  console.log('[LiveKit] Switched microphone to device:', deviceId)
}

// Get all remote participants in the room
export function getRemoteParticipants(room: Room): RemoteParticipant[] {
  return Array.from(room.remoteParticipants.values())
}

// Check if participant is an agent (using LiveKit's ParticipantKind)
export function isAgentParticipant(participant: RemoteParticipant): boolean {
  return participant.kind === ParticipantKind.AGENT
}
