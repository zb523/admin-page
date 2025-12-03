import { useCallback, useEffect, useState } from 'react'

export const MIC_STORAGE_KEY = 'baian-mic-device'

export function useMicDevices(applyDevice?: (deviceId: string) => Promise<void>) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError('Audio devices are not supported in this browser.')
      return
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const inputs = allDevices.filter((d) => d.kind === 'audioinput')
      setDevices(inputs)

      if (inputs.length === 0) {
        setError('No microphones found.')
        setSelectedId('')
        return
      }

      setError(null)

      const stored = (() => {
        try {
          return localStorage.getItem(MIC_STORAGE_KEY)
        } catch {
          return null
        }
      })()

      const next = inputs.find((d) => d.deviceId === stored)?.deviceId || inputs[0].deviceId
      setSelectedId(next)
    } catch (err) {
      console.error('Enumerate devices failed', err)
      setError('Unable to list microphones.')
    }
  }, [])

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedId(deviceId)
    try {
      localStorage.setItem(MIC_STORAGE_KEY, deviceId)
    } catch {
      // ignore storage write errors
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return
    const handleChange = () => refresh()
    navigator.mediaDevices.addEventListener('devicechange', handleChange)
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleChange)
  }, [refresh])

  useEffect(() => {
    if (!applyDevice || !selectedId) return
    applyDevice(selectedId)
      .then(() => setError(null))
      .catch((err) => {
        console.error('Apply microphone failed', err)
        setError('Unable to apply microphone.')
      })
  }, [applyDevice, selectedId])

  return {
    devices,
    selectedId,
    error,
    refresh,
    selectDevice,
  }
}
