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
  const [meterLevels, setMeterLevels] = useState<number[]>(() => Array(10).fill(20))
  const [isTesting, setIsTesting] = useState(false)

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

  const { level: micLevel } = useAudioMeter(isTesting || (isLive && isMicEnabled), selectedMicId)

  // Auto-stop testing when session starts
  useEffect(() => {
    if (isLive) {
      setIsTesting(false)
    }
  }, [isLive])

  const isConnecting = sessionPhase === 'connecting'
  const isWaitingAgent = sessionPhase === 'waiting_agent'
  const isIdle = sessionPhase === 'idle'
  const showTimerAndStatus = !isIdle // Show when connecting, waiting, or live

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

  // Audio meter - update when testing or live
  useEffect(() => {
    const isActive = isTesting || (isLive && isMicEnabled)
    if (!isActive) {
      setMeterLevels(Array(10).fill(20))
      return
    }
    const base = Math.max(25, micLevel * 80 + 25)
    const next = Array.from({ length: 10 }, () => Math.round(base + Math.random() * 30))
    setMeterLevels(next)
  }, [isLive, isMicEnabled, isTesting, micLevel])

  const formattedTimer = useMemo(() => {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return { minutes, seconds }
  }, [elapsedSeconds])

  const handleMainAction = () => {
    if (isLive) {
      stopSession()
    } else if (isConnecting || isWaitingAgent) {
      cancelSession()
    } else {
      startSession()
    }
  }

  const getMainButtonText = () => {
    if (isStopping) return 'Ending...'
    if (isLive) return 'End Session'
    if (isConnecting) return 'Cancel'
    if (isWaitingAgent) return 'Cancel'
    return 'Go Live'
  }

  const getStatusText = () => {
    if (isLive) return 'On Air'
    if (isConnecting) return 'Connecting...'
    if (isWaitingAgent) return 'Waiting...'
    return 'Offline'
  }

  return (
    <Layout>
      <div className="av-dashboard">
        {/* Hero Section */}
        <div className={`av-hero ${isLive ? 'av-hero--live' : ''}`}>
          {/* Status + Timer - only show when not idle */}
          {showTimerAndStatus && (
            <div className="av-timer-group animate-in">
              {/* Status */}
              <div className="av-status">
                <span className={`av-status__dot ${isLive ? 'av-status__dot--live' : ''}`} />
                <span className={`av-status__text ${isLive ? 'av-status__text--live' : ''}`}>
                  {getStatusText()}
                </span>
              </div>

              {/* Timer */}
              <div className="av-timer">
                <span>{formattedTimer.minutes}</span>
                <span className="av-timer__colon">:</span>
                <span>{formattedTimer.seconds}</span>
              </div>
            </div>
          )}

          {/* Main Button */}
          <button
            className={`av-main-btn ${isLive ? 'av-main-btn--stop' : 'av-main-btn--start'}`}
            onClick={handleMainAction}
            disabled={isStopping}
          >
            {isLive ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
            {getMainButtonText()}
          </button>

          {/* Error */}
          {error && (
            <div className="av-error">
              <span>{error}</span>
              <button onClick={clearError}>Dismiss</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="av-sidebar">
          {/* Microphone Section */}
          <div className="av-section">
            <span className="av-section__title">Microphone</span>
            <select
              className="av-select"
              value={selectedMicId}
              onChange={(e) => handleSelectMic(e.target.value)}
              disabled={micDevices.length === 0}
            >
              {micDevices.length === 0 && <option value="">No microphones</option>}
              {micDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || 'Microphone'}
                </option>
              ))}
            </select>

            {/* Test Button - only show when not live */}
            {!isLive && (
              <button
                className={`av-test-btn ${isTesting ? 'av-test-btn--active' : ''}`}
                onClick={() => setIsTesting(!isTesting)}
                disabled={micDevices.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                </svg>
                {isTesting ? 'Stop Test' : 'Test Mic'}
              </button>
            )}

            {/* Audio Meter - show when testing or live */}
            {(isTesting || isLive) && (
              <div className={`av-meter ${(isTesting || isMicEnabled) ? 'av-meter--active' : ''}`}>
                {meterLevels.map((h, i) => (
                  <div
                    key={i}
                    className="av-meter__bar"
                    style={{ height: `${Math.min(100, h)}%` }}
                  />
                ))}
              </div>
            )}

            {/* Mute Button - only show when live */}
            {isLive && (
              <button
                className={`av-mic-btn ${!isMicEnabled ? 'av-mic-btn--muted' : ''}`}
                onClick={toggleMicrophone}
              >
                {isMicEnabled ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
                {isMicEnabled ? 'Mute' : 'Unmute'}
              </button>
            )}

            {micError && <p className="av-mic-error">{micError}</p>}
          </div>

          {/* Languages Section */}
          <div className="av-section">
            <span className="av-section__title">Languages</span>
            <div className="av-langs">
              <span className="av-lang-tag av-lang-tag--input">
                {t.languages[(user?.input_lang || 'ar') as keyof typeof t.languages] || user?.input_lang}
              </span>
              <span className="av-lang-tag av-lang-tag--arrow">→</span>
              {user?.output_langs.map((lang) => (
                <span key={lang} className="av-lang-tag">
                  {t.languages[lang as keyof typeof t.languages] || lang}
                </span>
              ))}
            </div>
          </div>

          {/* Listener Link Section */}
          <div className="av-section">
            <span className="av-section__title">Listener Link</span>
            <div className="av-link-box">
              <span className="av-link-text">
                {listenerLink ? listenerLink.replace(/^https?:\/\//, '') : ''}
              </span>
              <button className="av-copy-btn" onClick={copyLink} disabled={!listenerLink}>
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Force Stop Modal */}
      {showForceStopModal && (
        <div className="av-modal-backdrop">
          <div className="av-modal">
            <h3>Active Session Found</h3>
            <p>You have an active session. Would you like to end it and start a new one?</p>
            <div className="av-modal__actions">
              <button className="av-modal__btn av-modal__btn--cancel" onClick={dismissForceStopModal}>
                Cancel
              </button>
              <button className="av-modal__btn av-modal__btn--confirm" onClick={forceStopAndRestart}>
                Stop & Restart
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .av-dashboard {
          display: grid;
          grid-template-columns: 1fr 340px;
          min-height: calc(100vh - 80px);
          background: var(--color-bg);
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid var(--color-border);
        }

        @media (max-width: 900px) {
          .av-dashboard {
            grid-template-columns: 1fr;
          }
        }

        /* Hero */
        .av-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 48px;
          position: relative;
          border-right: 1px solid var(--color-border);
        }

        .av-hero--live {
          background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.06) 0%, transparent 60%);
        }

        /* Status */
        .av-status {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .av-status__dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .av-status__dot--live {
          background: #10b981;
          box-shadow: 0 0 24px #10b981, 0 0 48px rgba(16, 185, 129, 0.3);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }

        /* Timer group wrapper with animation */
        .av-timer-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 48px;
        }

        .av-timer-group.animate-in {
          animation: timerReveal 0.4s ease-out forwards;
        }

        @keyframes timerReveal {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .av-status__text {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .av-status__text--live {
          color: #10b981;
        }

        /* Timer */
        .av-timer {
          font-size: 96px;
          font-weight: 200;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          color: var(--color-text);
          line-height: 1;
          display: flex;
          align-items: center;
        }

        .av-timer__colon {
          opacity: 0.4;
          margin: 0 4px;
        }

        /* Main Button */
        .av-main-btn {
          min-width: 220px;
          height: 68px;
          border-radius: 18px;
          border: none;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .av-main-btn--start {
          background: var(--color-accent);
          color: white;
          box-shadow: 0 8px 32px rgba(7, 108, 95, 0.35);
        }

        .av-main-btn--start:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(7, 108, 95, 0.45);
        }

        .av-main-btn--stop {
          background: rgba(255,255,255,0.08);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .av-main-btn--stop:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--color-danger);
        }

        .av-main-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Error */
        .av-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: var(--color-danger);
          font-size: 14px;
        }

        .av-error button {
          background: none;
          border: none;
          color: inherit;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        /* Sidebar */
        .av-sidebar {
          background: rgba(0,0,0,0.15);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          overflow-y: auto;
        }

        .av-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .av-section__title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          opacity: 0.5;
        }

        /* Select */
        .av-select {
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--color-text);
          font-size: 14px;
          width: 100%;
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }

        .av-select:focus {
          outline: none;
          border-color: var(--color-accent);
        }

        /* Meter */
        .av-meter {
          display: flex;
          gap: 4px;
          height: 48px;
          align-items: flex-end;
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .av-meter__bar {
          flex: 1;
          background: rgba(255,255,255,0.12);
          border-radius: 2px;
          transition: height 0.1s, background 0.1s;
        }

        .av-meter--active .av-meter__bar {
          background: #10b981;
        }

        /* Mic Button */
        .av-mic-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.05);
          color: var(--color-text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .av-mic-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .av-mic-btn--muted {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--color-danger);
        }

        /* Test Button */
        .av-test-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.05);
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .av-test-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--color-text);
        }

        .av-test-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .av-test-btn--active {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: white;
        }

        .av-test-btn--active:hover {
          background: var(--color-accent);
          opacity: 0.9;
        }

        .av-mic-error {
          font-size: 12px;
          color: var(--color-danger);
          margin: 0;
        }

        /* Languages */
        .av-langs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .av-lang-tag {
          padding: 8px 12px;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text);
          opacity: 0.8;
        }

        .av-lang-tag--input {
          background: var(--color-accent);
          color: white;
          opacity: 1;
        }

        .av-lang-tag--arrow {
          background: transparent;
          color: var(--color-text-muted);
          padding: 8px 4px;
          opacity: 0.4;
        }

        /* Link */
        .av-link-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          padding: 12px 14px;
          border: 1px solid var(--color-border);
        }

        .av-link-text {
          flex: 1;
          font-size: 12px;
          font-family: 'SF Mono', Monaco, monospace;
          color: var(--color-text);
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .av-copy-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .av-copy-btn:hover {
          background: var(--color-accent);
          color: white;
        }

        .av-copy-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Modal */
        .av-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
        }

        .av-modal {
          width: 100%;
          max-width: 400px;
          margin: 16px;
          padding: 32px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: 24px;
        }

        .av-modal h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 12px 0;
        }

        .av-modal p {
          font-size: 15px;
          color: var(--color-text-muted);
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .av-modal__actions {
          display: flex;
          gap: 12px;
        }

        .av-modal__btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .av-modal__btn--cancel {
          background: var(--color-bg-inset);
          border: 1px solid var(--color-border);
          color: var(--color-text);
        }

        .av-modal__btn--confirm {
          background: var(--color-danger);
          border: none;
          color: white;
        }
      `}</style>
    </Layout>
  )
}
