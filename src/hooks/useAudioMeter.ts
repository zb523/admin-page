import { useEffect, useState } from 'react'

interface UseAudioMeterResult {
  level: number // 0..1
  error: string | null
}

export function useAudioMeter(isActive: boolean, deviceId?: string): UseAudioMeterResult {
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive) {
      setLevel(0)
      return
    }

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let dataArray: Uint8Array | null = null
    let raf: number | null = null
    let stream: MediaStream | null = null

    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false,
        })
        audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        dataArray = new Uint8Array(analyser.frequencyBinCount)
        setError(null)

        const tick = () => {
          if (!analyser || !dataArray) return
          analyser.getByteTimeDomainData(dataArray)
          let sumSquares = 0
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128
            sumSquares += v * v
          }
          const rms = Math.sqrt(sumSquares / dataArray.length) // 0..1-ish
          setLevel(Math.min(1, rms * 2)) // normalize a bit hotter
          raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
      } catch (err) {
        console.error('Audio meter setup failed', err)
        setError('Unable to read microphone level.')
        setLevel(0)
      }
    }

    setup()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioContext) audioContext.close().catch(() => {})
    }
  }, [isActive, deviceId])

  return { level, error }
}
