<!-- be983164-1013-45d9-ac2f-0e9703dd72b7 a351bce3-5285-4323-9795-f51f17ce49ca -->
# Session UX Improvements

## Overview

Replace binary isStarting/isLive with phased session states, detect agent join/disconnect, handle 409 gracefully.

## Session Phases

| Phase | UI | Trigger |

|-------|-----|---------|

| `idle` | "Start Session" button | Initial state |

| `connecting` | "Connecting..." spinner | User clicks start |

| `waiting_agent` | "Waiting for interpreter..." (pulse) | Connected to room, agent not present |

| `live` | Full controls (mute/unmute, stop, share link) | Agent `khutbah-interpreter` detected |

| `agent_reconnecting` | "Interpreter reconnecting..." | Agent disconnected mid-session |

## Changes

### 1. Update [src/lib/livekit.ts](src/lib/livekit.ts)

Add callbacks for participant events:

```typescript
export interface LiveKitCallbacks {
  onConnected?: () => void
  onDisconnected?: (reason?: string) => void
  onParticipantConnected?: (participant: RemoteParticipant) => void
  onParticipantDisconnected?: (participant: RemoteParticipant) => void
  onError?: (error: Error) => void
}
```

Set up listeners in `connectToRoom`:

```typescript
room.on(RoomEvent.ParticipantConnected, (p) => callbacks?.onParticipantConnected?.(p))
room.on(RoomEvent.ParticipantDisconnected, (p) => callbacks?.onParticipantDisconnected?.(p))
```

Add helper to check existing participants:

```typescript
export function getRemoteParticipants(room: Room): RemoteParticipant[] {
  return Array.from(room.remoteParticipants.values())
}
```

### 2. Update [src/hooks/useSession.ts](src/hooks/useSession.ts)

Replace `isStarting` boolean with phase state:

```typescript
type SessionPhase = 'idle' | 'connecting' | 'waiting_agent' | 'live' | 'agent_reconnecting'
const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
const [showForceStopModal, setShowForceStopModal] = useState(false)
const [existingSessionId, setExistingSessionId] = useState<string | null>(null)
```

Update `startSession`:

```typescript
setSessionPhase('connecting')
try {
  const response = await apiStartSession()
  const room = await connectToRoom(token, {
    onParticipantConnected: (p) => {
      if (p.identity === 'khutbah-interpreter') {
        setSessionPhase('live')
        enableMicrophone(room) // Only enable mic when agent joins
      }
    },
    onParticipantDisconnected: (p) => {
      if (p.identity === 'khutbah-interpreter') {
        setSessionPhase('agent_reconnecting')
      }
    }
  })
  // Check if agent already in room
  const agentPresent = getRemoteParticipants(room).some(p => p.identity === 'khutbah-interpreter')
  setSessionPhase(agentPresent ? 'live' : 'waiting_agent')
  if (agentPresent) await enableMicrophone(room)
} catch (err) {
  if (err instanceof ApiError && err.status === 409) {
    setExistingSessionId(err.data.session_id)
    setShowForceStopModal(true)
    setSessionPhase('idle')
  }
}
```

Add `forceStopAndRestart`:

```typescript
const forceStopAndRestart = async () => {
  await apiStopSession() // Stop existing
  setShowForceStopModal(false)
  await startSession() // Start new
}
```

### 3. Update [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx)

Phase-based UI rendering:

```tsx
{sessionPhase === 'connecting' && <ConnectingState />}
{sessionPhase === 'waiting_agent' && <WaitingAgentState />}
{sessionPhase === 'agent_reconnecting' && <AgentReconnectingState />}
{sessionPhase === 'live' && <LiveControls />}

{/* 409 Modal */}
{showForceStopModal && (
  <Modal>
    <p>You have an active session. Stop it and start a new one?</p>
    <button onClick={forceStopAndRestart}>Yes, stop and restart</button>
    <button onClick={() => setShowForceStopModal(false)}>Cancel</button>
  </Modal>
)}
```

Waiting state shows hint after 30s:

```tsx
// In WaitingAgentState component
const [showHint, setShowHint] = useState(false)
useEffect(() => {
  const timer = setTimeout(() => setShowHint(true), 30000)
  return () => clearTimeout(timer)
}, [])
```

### 4. Update Zustand store ([src/store/useStore.ts](src/store/useStore.ts))

Add `sessionPhase` to store (optional - could keep in hook if preferred).

## Agent Identity

- Exact match: `khutbah-interpreter`

## Edge Cases Handled

- Agent joins before speaker → check `remoteParticipants` after connect
- Agent joins after speaker → `ParticipantConnected` event
- Agent disconnects mid-session → show reconnecting state, auto-recover when rejoins
- 409 (session already live) → modal to force stop and restart
- User cancels while waiting → stop session button always available

### To-dos

- [x] Initialize Vite + React + TS project with deps
- [x] Create src/lib/ (supabase.ts, api.ts, livekit.ts)
- [x] Implement Zustand store and useAuth/useSession hooks
- [x] Build LoginPage, OnboardingPage, AuthGuard
- [x] Build DashboardPage with start/stop session, LiveKit mic integration
- [x] Build HistoryPage + HistoryDetailPage
- [x] Build SettingsPage for profile updates
- [x] Add wrangler.jsonc for Cloudflare Workers Static Assets deployment
- [ ] Initialize Vite + React + TS project with deps (tailwind, supabase-js, livekit-client, zustand, react-router)
- [ ] Move auth listener to useStore.ts with initializeAuth()
- [ ] Remove listener setup from useAuth hook, keep only state/actions
- [ ] Update OnboardingPage and App.tsx to use simplified hook
- [ ] Build, deploy, and test the fix
- [x] Move auth listener to useStore.ts with initializeAuth()
- [x] Remove listener setup from useAuth hook, keep only state/actions
- [x] Update OnboardingPage and App.tsx to use simplified hook
- [x] Build, deploy, and test the fix
- [ ] Initialize Vite + React + TS project with deps (tailwind, supabase-js, livekit-client, zustand, react-router)
- [ ] Move auth listener to useStore.ts with initializeAuth()
- [ ] Remove listener setup from useAuth hook, keep only state/actions
- [ ] Update OnboardingPage and App.tsx to use simplified hook
- [ ] Build, deploy, and test the fix
- [x] Remove initializeAuth and fetchUserProfile from useStore.ts
- [x] Rewrite useAuth.ts with single useEffect, getSession-based init
- [x] Test locally with npm run dev in private window
- [x] Deploy and verify fix
- [ ] Initialize Vite + React + TS project with deps
- [ ] Create src/lib/ (supabase.ts, api.ts, livekit.ts)
- [ ] Implement Zustand store and useAuth/useSession hooks
- [ ] Build LoginPage, OnboardingPage, AuthGuard
- [ ] Build DashboardPage with start/stop session, LiveKit mic integration
- [ ] Build HistoryPage + HistoryDetailPage
- [ ] Build SettingsPage for profile updates
- [ ] Add wrangler.jsonc for Cloudflare Workers Static Assets deployment
- [ ] Move initialized guard to module level in useAuth.ts
- [x] Move initialized guard to module level in useAuth.ts
- [ ] Initialize Vite + React + TS project with deps
- [ ] Create src/lib/ (supabase.ts, api.ts, livekit.ts)
- [ ] Implement Zustand store and useAuth/useSession hooks
- [ ] Build LoginPage, OnboardingPage, AuthGuard
- [ ] Build DashboardPage with start/stop session, LiveKit mic integration
- [ ] Build HistoryPage + HistoryDetailPage
- [ ] Build SettingsPage for profile updates
- [ ] Add wrangler.jsonc for Cloudflare Workers Static Assets deployment
- [ ] Move auth listener to useStore.ts with initializeAuth()
- [ ] Remove listener setup from useAuth hook, keep only state/actions
- [ ] Update OnboardingPage and App.tsx to use simplified hook
- [ ] Build, deploy, and test the fix
- [ ] Remove initializeAuth and fetchUserProfile from useStore.ts
- [ ] Rewrite useAuth.ts with single useEffect, getSession-based init
- [ ] Test locally with npm run dev in private window
- [ ] Deploy and verify fix
- [ ] Add participant connected/disconnected callbacks to livekit.ts
- [ ] Add sessionPhase state and forceStopAndRestart to useSession hook
- [ ] Update DashboardPage with phase-based UI and 409 modal
- [ ] Test locally then deploy