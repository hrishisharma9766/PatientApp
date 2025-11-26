import { useEffect, useMemo, useState } from 'react'
import { Mic, Pause, Square } from 'lucide-react'

interface RecordingControlsProps {
  status: string
  timer: string
  className?: string
  onStarted?: () => void
  onStopped?: () => void
  onPaused?: () => void
}

export function RecordingControls({ status, timer, className, onStarted, onStopped, onPaused }: RecordingControlsProps) {
  const initialSeconds = useMemo(() => {
    const parts = timer.split(':')
    const m = parseInt(parts[0] || '0', 10)
    const s = parseInt(parts[1] || '0', 10)
    return m * 60 + s
  }, [timer])
  const initialState = (() => {
    const v = status.toLowerCase()
    if (v === 'recording') return 'recording'
    if (v === 'paused') return 'paused'
    if (v === 'stopped') return 'stopped'
    return 'stopped'
  })() as 'recording' | 'paused' | 'stopped'

  const [recState, setRecState] = useState<'recording' | 'paused' | 'stopped'>(initialState)
  const [seconds, setSeconds] = useState(initialSeconds)
  const [hasInteracted, setHasInteracted] = useState(false)

  const isRecording = recState === 'recording'

  useEffect(() => {
    let id: number | undefined
    if (isRecording) {
      id = window.setInterval(() => {
        setSeconds((v) => v + 1)
      }, 1000)
    }
    return () => {
      if (id) window.clearInterval(id)
    }
  }, [isRecording])

  const display = useMemo(() => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    const mm = m.toString().padStart(2, '0')
    const ss = s.toString().padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  function toggle() {
    setRecState((s) => (s === 'recording' ? 'paused' : 'recording'))
    setHasInteracted(true)
  }

  function stop() {
    setRecState('stopped')
    setSeconds(0)
    setHasInteracted(true)
  }

  useEffect(() => {
    if (!hasInteracted) return
    if (recState === 'recording') onStarted?.()
    else if (recState === 'paused') onPaused?.()
    else onStopped?.()
  }, [recState, hasInteracted, onStarted, onPaused, onStopped])

  return (
    <div className={`mt-4 ${className ?? ''}`}>
      <div className="flex flex-col items-center">
        <div className="font-mono text-4xl text-gray-900">{display}</div>
        <div className="mt-1 flex items-center">
          <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${recState === 'recording' ? 'bg-green-600' : recState === 'paused' ? 'bg-gray-400' : 'bg-red-600'}`}></span>
          <span className="text-sm text-gray-800">{recState === 'recording' ? 'Recording' : recState === 'paused' ? 'Paused' : 'Stopped'}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className={`p-1 rounded-full border-2 border-dashed ${
          isRecording ? 'border-green-600' : hasInteracted ? 'border-gray-300' : 'border-green-600'
        }`}>
          <button
            type="button"
            aria-label={isRecording ? 'Pause' : 'Start Recording'}
            onClick={toggle}
            className={`inline-flex items-center justify-center rounded-full w-12 h-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isRecording
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : hasInteracted
                  ? 'bg-gray-400 text-white hover:bg-gray-500 focus:ring-gray-400'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isRecording ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Mic className={`w-6 h-6 ${hasInteracted ? 'text-white' : 'text-green-200'}`} />
            )}
          </button>
        </div>
        <div className="p-1 rounded-full border-2 border-dashed border-gray-300">
          <button
            type="button"
            aria-label="Stop"
            onClick={stop}
            className="inline-flex items-center justify-center rounded-full w-11 h-11 bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}