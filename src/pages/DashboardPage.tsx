import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useStore } from '@/store/useStore'
import { useSession } from '@/hooks/useSession'
import { SUPPORTED_LANGUAGES } from '@/types'

export function DashboardPage() {
  const { user } = useStore()
  const {
    activeSession,
    sessionPhase,
    isLive,
    isMicEnabled,
    isStopping,
    error,
    showForceStopModal,
    startSession,
    stopSession,
    cancelSession,
    forceStopAndRestart,
    dismissForceStopModal,
    toggleMicrophone,
    getListenerLink,
    clearError,
  } = useSession()

  const [copied, setCopied] = useState(false)

  const listenerLink = getListenerLink()

  const copyLink = async () => {
    if (!listenerLink) return
    await navigator.clipboard.writeText(listenerLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine what to show based on phase
  const isConnecting = sessionPhase === 'connecting'
  const isWaitingAgent = sessionPhase === 'waiting_agent'
  const isAgentReconnecting = sessionPhase === 'agent_reconnecting'

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Manage your live translation sessions
          </p>
        </div>

        {/* Status Card */}
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Phase-based Status Display */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <StatusIndicator phase={sessionPhase} />
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {getStatusTitle(sessionPhase)}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {getStatusSubtitle(sessionPhase, activeSession?.room_name)}
                </p>
              </div>
            </div>

            {/* Main Action Button */}
            {sessionPhase === 'idle' ? (
              <button
                onClick={startSession}
                className="px-6 py-3 rounded-xl font-medium transition-colors"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                }}
              >
                Start Session
              </button>
            ) : isLive ? (
              <button
                onClick={stopSession}
                disabled={isStopping}
                className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                }}
              >
                {isStopping ? 'Stopping...' : 'Stop Session'}
              </button>
            ) : (
              // Connecting, waiting agent, or reconnecting - show cancel
              <button
                onClick={cancelSession}
                disabled={isStopping}
                className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                }}
              >
                {isStopping ? 'Canceling...' : 'Cancel'}
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-6"
              style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
            >
              <span className="text-sm">{error}</span>
              <button onClick={clearError} className="text-sm font-medium">
                Dismiss
              </button>
            </div>
          )}

          {/* Connecting State */}
          {isConnecting && <ConnectingState />}

          {/* Waiting for Agent State */}
          {isWaitingAgent && <WaitingAgentState />}

          {/* Agent Reconnecting State */}
          {isAgentReconnecting && <AgentReconnectingState />}

          {/* Live Controls - only when agent is connected */}
          {isLive && (
            <LiveControls
              isMicEnabled={isMicEnabled}
              toggleMicrophone={toggleMicrophone}
              listenerLink={listenerLink}
              copied={copied}
              copyLink={copyLink}
            />
          )}
        </div>

        {/* Language Config */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Language Configuration
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Speaking
              </p>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                {SUPPORTED_LANGUAGES[user?.input_lang || 'ar'] || user?.input_lang}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Translating to
              </p>
              <div className="flex flex-wrap gap-2">
                {user?.output_langs.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-1 rounded text-sm font-medium"
                    style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                  >
                    {SUPPORTED_LANGUAGES[lang] || lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Force Stop Modal */}
      {showForceStopModal && (
        <ForceStopModal
          onConfirm={forceStopAndRestart}
          onCancel={dismissForceStopModal}
        />
      )}
    </Layout>
  )
}

// --- Sub-components ---

function StatusIndicator({ phase }: { phase: string }) {
  const isActive = phase === 'live'
  const isPulsing = phase === 'connecting' || phase === 'waiting_agent' || phase === 'agent_reconnecting'
  
  let color = 'var(--color-text-dim)'
  if (isActive) color = 'var(--color-live)'
  else if (isPulsing) color = 'var(--color-warning)'

  return (
    <div
      className={`w-4 h-4 rounded-full ${isActive ? 'animate-pulse-live' : ''} ${isPulsing ? 'animate-pulse' : ''}`}
      style={{ background: color }}
    />
  )
}

function getStatusTitle(phase: string): string {
  switch (phase) {
    case 'connecting': return 'Connecting...'
    case 'waiting_agent': return 'Waiting for Interpreter'
    case 'live': return 'You are LIVE'
    case 'agent_reconnecting': return 'Interpreter Reconnecting...'
    default: return 'Not Broadcasting'
  }
}

function getStatusSubtitle(phase: string, roomName?: string): string {
  switch (phase) {
    case 'connecting': return 'Establishing connection to room'
    case 'waiting_agent': return 'Connected. Waiting for interpreter to join...'
    case 'live': return `Room: ${roomName || 'Active'}`
    case 'agent_reconnecting': return 'Interpreter disconnected. Waiting for reconnect...'
    default: return 'Start a session to begin translating'
  }
}

function ConnectingState() {
  return (
    <div className="flex items-center gap-4 py-4">
      <div 
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
      />
      <div>
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
          Connecting to room...
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This may take a few seconds
        </p>
      </div>
    </div>
  )
}

function WaitingAgentState() {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 30000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="py-4">
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-8 h-8 rounded-full animate-pulse flex items-center justify-center"
          style={{ background: 'var(--color-warning-muted)' }}
        >
          <span style={{ color: 'var(--color-warning)' }}>⏳</span>
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>
            Waiting for interpreter to join...
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your microphone will be enabled once connected
          </p>
        </div>
      </div>
      
      {showHint && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}
        >
          Taking longer than usual. The interpreter service may be starting up—please wait a moment.
        </div>
      )}
    </div>
  )
}

function AgentReconnectingState() {
  return (
    <div className="flex items-center gap-4 py-4">
      <div 
        className="w-8 h-8 rounded-full animate-pulse flex items-center justify-center"
        style={{ background: 'var(--color-warning-muted)' }}
      >
        <span style={{ color: 'var(--color-warning)' }}>🔄</span>
      </div>
      <div>
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
          Interpreter reconnecting...
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Session paused. Will resume when interpreter reconnects.
        </p>
      </div>
    </div>
  )
}

interface LiveControlsProps {
  isMicEnabled: boolean
  toggleMicrophone: () => void
  listenerLink: string | null
  copied: boolean
  copyLink: () => void
}

function LiveControls({ isMicEnabled, toggleMicrophone, listenerLink, copied, copyLink }: LiveControlsProps) {
  return (
    <div className="space-y-6">
      {/* Microphone Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isMicEnabled ? 'var(--color-accent-muted)' : 'var(--color-bg)',
            }}
          >
            {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--color-text)' }}>
              Microphone
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {isMicEnabled ? 'Active - listeners can hear you' : 'Muted'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleMicrophone}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            background: isMicEnabled ? 'var(--color-bg)' : 'var(--color-accent)',
            color: isMicEnabled ? 'var(--color-text)' : 'var(--color-bg)',
            border: isMicEnabled ? '1px solid var(--color-border)' : 'none',
          }}
        >
          {isMicEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>

      {/* Shareable Link */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Share with listeners
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={listenerLink || ''}
            className="flex-1 px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: copied ? 'var(--color-accent-muted)' : 'var(--color-accent)',
              color: copied ? 'var(--color-accent)' : 'var(--color-bg)',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ForceStopModalProps {
  onConfirm: () => void
  onCancel: () => void
}

function ForceStopModal({ onConfirm, onCancel }: ForceStopModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md mx-4 p-6 rounded-2xl"
        style={{ 
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Session Already Active
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          You have an existing session running. Would you like to stop it and start a new one?
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: 'var(--color-danger)',
              color: 'white',
            }}
          >
            Stop & Restart
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Icons ---

function MicIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: 'var(--color-accent)' }}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: 'var(--color-text-dim)' }}
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
