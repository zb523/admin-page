import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useStore } from '@/store/useStore'
import { useSession } from '@/hooks/useSession'
import { useMicDevices } from '@/hooks/useMicDevices'
import { useAudioMeter } from '@/hooks/useAudioMeter'
import { useLanguage } from '@/hooks/useLanguage'
import { setAudioInputDevice } from '@/lib/livekit'

export function DashboardPage() {
  const { user, livekitRoom } = useStore()
  const { t } = useLanguage()
  const {
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [meterLevels, setMeterLevels] = useState<number[]>(() => Array(12).fill(8))

  const listenerLink = getListenerLink()

  const copyLink = async () => {
    if (!listenerLink) return
    await navigator.clipboard.writeText(listenerLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyMicToRoom = useCallback(
    async (deviceId: string) => {
      if (!livekitRoom) return
      await setAudioInputDevice(livekitRoom, deviceId)
    },
    [livekitRoom],
  )

  const {
    devices: micDevices,
    selectedId: selectedMicId,
    error: micError,
    selectDevice: handleSelectMic,
  } = useMicDevices(applyMicToRoom)

  const { level: micLevel, error: meterError } = useAudioMeter(isLive && isMicEnabled, selectedMicId)

  // Determine what to show based on phase
  const isConnecting = sessionPhase === 'connecting'
  const isWaitingAgent = sessionPhase === 'waiting_agent'
  const isAgentReconnecting = sessionPhase === 'agent_reconnecting'

  // Timer
  useEffect(() => {
    if (!isLive) {
      setElapsedSeconds(0)
      return
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isLive])

  // Audio meter driven by mic level
  useEffect(() => {
    if (!isLive || !isMicEnabled) {
      setMeterLevels(Array(12).fill(6))
      return
    }

    const base = Math.max(6, micLevel * 90 + 6)
    const next = Array.from({ length: 12 }, (_, i) => Math.round(base * (0.72 + i * 0.015)))
    setMeterLevels(next)
  }, [isLive, isMicEnabled, micLevel])

  const formattedTimer = useMemo(() => {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [elapsedSeconds])

  const showFullControls = sessionPhase !== 'idle'

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--color-text)' }}>
            {t.DashboardPage.title}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t.DashboardPage.subtitle}
          </p>
        </div>

        {/* Status Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 mb-8 transition-all duration-300"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            minHeight: showFullControls ? 'auto' : '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {isLive && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(16,185,129,0.08)' }}
            />
          )}

          {!showFullControls ? (
            // Idle State: Simple Start Button
            <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
              <button
                onClick={startSession}
                className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 20px 40px -12px var(--color-accent)',
                }}
              >
                <span className="text-xl">▶</span>
                {t.DashboardPage.button_start}
              </button>
            </div>
          ) : (
            // Active State: Full Controls
            <div className="relative space-y-6 animate-fade-in">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>
                      {t.DashboardPage.timer_label}
                    </p>
                    <TimerDisplay value={formattedTimer} />
                    <div className="mt-2 flex items-center gap-2">
                      {isLive ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(16,185,129,0.15)',
                            color: 'var(--color-live)',
                            border: '1px solid rgba(16,185,129,0.35)',
                          }}
                        >
                          <HeartbeatIcon />
                          {t.DashboardPage.status_excellent}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: 'var(--color-bg)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {t.common.loading}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1 min-w-[200px]">
                  <AudioMeter
                    levels={meterLevels}
                    state={isLive ? (isMicEnabled ? 'live' : 'muted') : 'idle'}
                  />
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--color-text-muted)' }}>
                    {t.DashboardPage.input_level}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {isLive ? (
                    <button
                      onClick={stopSession}
                      disabled={isStopping}
                      className="px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                      style={{
                        background: 'var(--color-danger)',
                        color: 'white',
                      }}
                    >
                      {isStopping ? t.common.loading : t.DashboardPage.button_stop}
                    </button>
                  ) : (
                    <button
                      onClick={cancelSession}
                      disabled={isStopping}
                      className="px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                      style={{
                        background: 'var(--color-bg)',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger)',
                      }}
                    >
                      {isStopping ? t.common.loading : t.common.cancel}
                    </button>
                  )}
                </div>
              </div>

              {/* Live-only mic controls (compact) */}
              {isLive && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={selectedMicId}
                      onChange={(e) => handleSelectMic(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                      disabled={micDevices.length === 0}
                    >
                      {micDevices.length === 0 && <option value="">No microphones detected</option>}
                      {micDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || 'Microphone'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={toggleMicrophone}
                    disabled={!isLive}
                    className="px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    style={{
                      background: isMicEnabled ? 'var(--color-bg)' : 'var(--color-accent)',
                      color: isMicEnabled ? 'var(--color-text)' : 'var(--color-bg)',
                      border: isMicEnabled ? '1px solid var(--color-border)' : 'none',
                    }}
                    type="button"
                  >
                    {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
                    {isMicEnabled ? t.DashboardPage.button_mute : t.DashboardPage.button_unmute}
                  </button>
                </div>
              )}

              {(micError || meterError) && (
                <div
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
                >
                  {micError || meterError}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
                >
                  <span className="text-sm">{error}</span>
                  <button onClick={clearError} className="text-sm font-medium">
                    {t.common.dismiss}
                  </button>
                </div>
              )}

              {/* Connecting/Waiting states */}
              {isConnecting && <ConnectingState />}
              {isWaitingAgent && <WaitingAgentState />}
              {isAgentReconnecting && <AgentReconnectingState />}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-lg p-6 h-full"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {t.DashboardPage.card_lang_title}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t.DashboardPage.label_speaking}
                </p>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {t.languages[(user?.input_lang || 'ar') as keyof typeof t.languages] || user?.input_lang}
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t.DashboardPage.label_translating_to}
                </p>
                <div className="flex flex-wrap gap-2">
                  {user?.output_langs.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 rounded text-sm font-medium"
                      style={{
                        background: 'var(--color-bg)',
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

          <ListenerCard
            listenerLink={listenerLink}
            copied={copied}
            copyLink={copyLink}
          />
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

function ConnectingState() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-4 py-4">
      <div 
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
      />
      <div>
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
          {t.DashboardPage.msg_connecting}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.DashboardPage.msg_wait_seconds}
        </p>
      </div>
    </div>
  )
}

function WaitingAgentState() {
  const [showHint, setShowHint] = useState(false)
  const { t } = useLanguage()

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
            {t.DashboardPage.msg_waiting_interpreter}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t.DashboardPage.msg_mic_enabled}
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
  const { t } = useLanguage()
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
          {t.DashboardPage.msg_interpreter_reconnecting}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.DashboardPage.msg_session_paused}
        </p>
      </div>
    </div>
  )
}

interface ListenerCardProps {
  listenerLink: string | null
  copied: boolean
  copyLink: () => void
}

function ListenerCard({ listenerLink, copied, copyLink }: ListenerCardProps) {
  const { t } = useLanguage()
  return (
    <div
      className="rounded-lg p-6 h-full flex flex-col gap-4"
      style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {t.DashboardPage.card_listener_title}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t.DashboardPage.card_listener_subtitle}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          QR
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={listenerLink || ''}
          className="flex-1 px-4 py-3 rounded-lg text-sm"
          dir="ltr"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
          }}
        />
        <button
          onClick={copyLink}
          disabled={!listenerLink}
          className="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            background: copied ? 'var(--color-live-muted)' : 'var(--color-accent)',
            color: copied ? 'var(--color-live)' : 'var(--color-bg)',
          }}
          type="button"
        >
          {copied ? t.DashboardPage.button_copied : t.DashboardPage.button_copy}
        </button>
      </div>
    </div>
  )
}

// Icons
function TimerDisplay({ value }: { value: string }) {
  // Timer is always LTR
  return (
    <div className="flex items-center timer-display" dir="ltr" style={{ color: 'var(--color-text)' }}>
      <span className="text-6xl md:text-7xl">{value.split(':')[0]}</span>
      <span className="timer-colon" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="text-6xl md:text-7xl">{value.split(':')[1]}</span>
    </div>
  )
}

function HeartbeatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 12 8 12 11 5 13 19 16 12 20 12" />
    </svg>
  )
}

function AudioMeter({ levels, state }: { levels: number[]; state: 'idle' | 'live' | 'muted' }) {
  if (state !== 'live') {
    return (
      <div className="h-16 w-full flex items-center justify-center">
        <div className="flex items-center gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: '10px',
                height: '3px',
                borderRadius: '9999px',
                background: i % 2 === 0 ? 'var(--color-border-hover)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1.5 h-16">
      {levels.map((h, idx) => (
        <span
          key={idx}
          style={{
            width: '6px',
            height: `${h}px`,
            background: 'var(--color-live)',
            borderRadius: '6px 6px 2px 2px',
            transition: 'height 120ms ease, background 150ms ease',
          }}
        />
      ))}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

interface ForceStopModalProps {
  onConfirm: () => void
  onCancel: () => void
}

function ForceStopModal({ onConfirm, onCancel }: ForceStopModalProps) {
  const { t } = useLanguage()
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
          {t.DashboardPage.modal_active_title}
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {t.DashboardPage.modal_active_body}
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
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: 'var(--color-danger)',
              color: 'white',
            }}
          >
            {t.DashboardPage.button_stop_restart}
          </button>
        </div>
      </div>
    </div>
  )
}
