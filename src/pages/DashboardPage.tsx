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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display mb-1 tracking-tight" style={{ color: 'var(--color-text)' }}>
              {t.DashboardPage.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.DashboardPage.subtitle}
            </p>
          </div>
          {/* Status Pill - mimicking the screenshot "Offline/Live" status */}
          <div 
            className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border"
            style={{ 
              background: isLive ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-elevated)',
              borderColor: isLive ? 'rgba(16,185,129,0.3)' : 'var(--color-border)',
              color: isLive ? 'var(--color-live)' : 'var(--color-text-muted)'
            }}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(7,108,95,0.6)]' : 'bg-gray-500/40'}`} />
              {isLive ? 'ON AIR' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Status Card (Hero) */}
        <div
          className="relative overflow-hidden mb-8 transition-all duration-300 shadow-baian rounded-[2rem]"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            minHeight: showFullControls ? 'auto' : '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          {isLive && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(7, 108, 95, 0.05)' }} // baian-emerald/5
            />
          )}

          {!showFullControls ? (
            // Idle State: Simple Start Button
            <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
              <button
                onClick={startSession}
                className="px-10 h-16 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 shadow-[0_12px_24px_rgba(7,108,95,0.2)] hover:shadow-[0_16px_32px_rgba(7,108,95,0.3)]"
                style={{
                  background: 'var(--color-accent)',
                  color: '#ffffff', // Force white text on accent
                }}
              >
                <span className="text-xl">▶</span>
                {t.DashboardPage.button_start}
              </button>
            </div>
          ) : (
            // Active State: Full Controls
            <div className="relative space-y-8 animate-fade-in">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                {/* Timer Section */}
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                      {t.DashboardPage.timer_label}
                    </p>
                    <TimerDisplay value={formattedTimer} />
                    <div className="mt-3">
                      {isLive ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                          style={{
                            background: 'rgba(16,185,129,0.1)',
                            color: 'var(--color-live)',
                            borderColor: 'rgba(16,185,129,0.2)',
                          }}
                        >
                          <HeartbeatIcon />
                          {t.DashboardPage.status_excellent}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                          style={{
                            background: 'var(--color-baian-sand)', 
                            opacity: 0.2,
                            color: 'var(--color-text-muted)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          {t.common.loading}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio Meter */}
                <div className="flex flex-col items-center gap-2 flex-1 min-w-[200px]">
                  <AudioMeter
                    levels={meterLevels}
                    state={isLive ? (isMicEnabled ? 'live' : 'muted') : 'idle'}
                  />
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>
                    {t.DashboardPage.input_level}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-end gap-2">
                   {isLive ? (
                    <button
                      onClick={stopSession}
                      disabled={isStopping}
                      className="px-8 h-16 rounded-2xl font-semibold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl disabled:opacity-60"
                      style={{
                        background: 'var(--color-bg-elevated)', // Inverted look for stop
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {isStopping ? t.common.loading : t.DashboardPage.button_stop}
                    </button>
                  ) : (
                    <button
                      onClick={cancelSession}
                      disabled={isStopping}
                      className="px-8 h-16 rounded-2xl font-semibold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
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

              {/* Audio Configuration Section (Live) */}
              <div className="rounded-3xl border overflow-hidden shadow-baian" style={{ 
                  background: 'var(--color-bg-elevated)', 
                  borderColor: 'var(--color-border)',
                  marginTop: '2rem' 
                }}>
                <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                   <h3 className="font-display font-semibold tracking-wide" style={{ color: 'var(--color-text)' }}>
                      Audio Configuration
                    </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Microphone Input</label>
                    <span className="text-xs opacity-50" style={{ color: 'var(--color-text-muted)' }}>Select sources</span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                         <select
                          value={selectedMicId}
                          onChange={(e) => handleSelectMic(e.target.value)}
                          className="w-full pl-4 pr-10 py-3.5 rounded-xl text-sm appearance-none cursor-pointer transition-all hover:border-opacity-50"
                          style={{
                            background: 'rgba(0,0,0,0.2)', // Dark inset
                            border: '1px solid rgba(255,255,255,0.1)',
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
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" style={{ color: 'var(--color-text)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={toggleMicrophone}
                      disabled={!isLive}
                      className="h-[50px] px-6 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shrink-0 border"
                      style={{
                        background: isMicEnabled ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.2)', // Red tint when muted
                        borderColor: isMicEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.4)',
                        color: isMicEnabled ? 'var(--color-text)' : 'var(--color-danger)',
                      }}
                      type="button"
                    >
                      {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
                      {isMicEnabled ? t.DashboardPage.button_mute : t.DashboardPage.button_unmute}
                    </button>
                  </div>
                </div>
              </div>

              {(micError || meterError) && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
                >
                  {micError || meterError}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="flex items-center justify-between px-6 py-4 rounded-2xl"
                  style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
                >
                  <span className="text-sm font-medium">{error}</span>
                  <button onClick={clearError} className="text-sm font-bold hover:underline">
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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health - Moved here to match layout better if possible, or keep 2 cols */}
           <div className="lg:col-span-2 space-y-6">
             <div
                className="rounded-[2rem] p-0 h-full shadow-baian overflow-hidden"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                   <h3 className="font-display font-semibold tracking-wide" style={{ color: 'var(--color-text)' }}>
                      {t.DashboardPage.card_lang_title}
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2 opacity-50" style={{ color: 'var(--color-text-muted)' }}>
                      {t.DashboardPage.label_speaking}
                    </p>
                    <p className="font-medium text-lg" style={{ color: 'var(--color-text)' }}>
                      {t.languages[(user?.input_lang || 'ar') as keyof typeof t.languages] || user?.input_lang}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2 opacity-50" style={{ color: 'var(--color-text-muted)' }}>
                      {t.DashboardPage.label_translating_to}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.output_langs.map((lang) => (
                        <span
                          key={lang}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{
                            background: 'var(--color-bg-inset)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {t.languages[lang as keyof typeof t.languages] || lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
           </div>

          <div className="lg:col-span-1">
             <ListenerCard
              listenerLink={listenerLink}
              copied={copied}
              copyLink={copyLink}
            />
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

function ConnectingState() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-4 py-4 border-t border-dashed" style={{ borderColor: 'var(--color-border)' }}>
      <div 
        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
      />
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
          {t.DashboardPage.msg_connecting}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
    <div className="py-4 border-t border-dashed" style={{ borderColor: 'var(--color-border)' }}>
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
    <div className="flex items-center gap-4 py-4 border-t border-dashed" style={{ borderColor: 'var(--color-border)' }}>
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
      className="rounded-[2rem] p-6 h-full flex flex-col gap-6 shadow-baian"
      style={{ background: 'var(--color-deep-teal-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold font-display tracking-wide" style={{ color: 'white' }}>
            {t.DashboardPage.card_listener_title}
          </p>
          <p className="text-baian-sand/60 text-sm mt-1" style={{ color: 'rgba(234, 215, 197, 0.6)' }}>
            {t.DashboardPage.card_listener_subtitle}
          </p>
        </div>
        <div
          className="bg-white/10 p-2 rounded-lg"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ead7c5" strokeWidth="2">
             <path d="M3 7V5a2 2 0 0 1 2-2h2" />
             <path d="M17 3h2a2 2 0 0 1 2 2v2" />
             <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
             <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
             <rect x="7" y="7" width="3" height="3" rx="1" />
             <rect x="14" y="7" width="3" height="3" rx="1" />
             <rect x="7" y="14" width="3" height="3" rx="1" />
             <path d="M14 17h3" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 mt-auto">
        <div
          className="flex-1 px-3 py-2 text-sm font-mono truncate select-all"
          dir="ltr"
          style={{
            color: '#ead7c5', // baian-sand
          }}
        >
           {listenerLink ? listenerLink.replace(/^https?:\/\//, '') : ''}
        </div>
        <button
          onClick={copyLink}
          disabled={!listenerLink}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          style={{
            color: copied ? 'var(--color-live)' : 'var(--color-baian-emerald)',
          }}
          type="button"
        >
          {copied ? (
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          )}
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
      <span className="text-6xl md:text-7xl font-mono font-light tabular-nums tracking-tighter">{value.split(':')[0]}</span>
      <span className="timer-colon opacity-50" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="text-6xl md:text-7xl font-mono font-light tabular-nums tracking-tighter">{value.split(':')[1]}</span>
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
      <div className="h-12 w-full max-w-[120px] flex items-end justify-center gap-[3px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-t-sm transition-all duration-100"
            style={{
              height: '50%',
              background: 'rgba(255,255,255,0.1)'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-[3px] h-12 w-full max-w-[120px]">
      {levels.map((h, idx) => (
        <div
          key={idx}
          className="w-1.5 rounded-t-sm transition-all duration-100"
          style={{
            height: `${Math.min(100, Math.max(10, (h / 50) * 100))}%`,
            background: 'var(--color-live)',
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
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md mx-4 p-8 rounded-3xl shadow-2xl"
        style={{ 
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3 className="text-xl font-bold font-display mb-3" style={{ color: 'var(--color-text)' }}>
          {t.DashboardPage.modal_active_title}
        </h3>
        <p className="mb-8 text-lg" style={{ color: 'var(--color-text-muted)' }}>
          {t.DashboardPage.modal_active_body}
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors"
            style={{
              background: 'var(--color-bg-inset)',
              color: 'var(--color-text)',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
            style={{
              background: 'var(--color-danger)',
              color: 'white',
              boxShadow: '0 4px 14px var(--color-danger-muted)'
            }}
          >
            {t.DashboardPage.button_stop_restart}
          </button>
        </div>
      </div>
    </div>
  )
}
