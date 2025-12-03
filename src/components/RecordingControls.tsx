import { useEffect, useMemo, useState } from 'react'
import { Mic, Pause, Square, Play } from 'lucide-react'

interface RecordingControlsProps {
  status: string
  timer: string
  className?: string
  onStarted?: () => void
  onStopped?: () => void
  onPaused?: () => void
  onUpload?: (file: File) => void
}

export function RecordingControls({ status, timer, className, onStarted, onStopped, onPaused, onUpload }: RecordingControlsProps) {
  const initialSeconds = useMemo(() => {
    const parts = timer.split(':')
    const m = parseInt(parts[0] || '0', 10)
    const s = parseInt(parts[1] || '0', 10)
    return m * 60 + s
  }, [timer])
  const curStatus = (() => {
    const v = status?.toLowerCase?.() || 'stopped'
    return v === 'recording' || v === 'paused' ? v : 'stopped'
  })() as 'recording' | 'paused' | 'stopped'
  const [seconds, setSeconds] = useState(initialSeconds)
  const [hasInteracted, setHasInteracted] = useState(false)

  const isRecording = curStatus === 'recording'

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
    if (curStatus === 'stopped') {
      onStarted?.()
      return
    }
    if (curStatus === 'recording') {
      onPaused?.()
      setHasInteracted(true)
      return
    }
    onStarted?.()
    setHasInteracted(true)
  }

  function stop() {
    onStopped?.()
    setSeconds(0)
    setHasInteracted(true)
  }

  useEffect(() => {
    if (!isRecording) return
    const id = window.setInterval(() => {
      setSeconds((v) => v + 1)
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [isRecording])

  return (
    <div className={`mt-4 ${className ?? ''}`}>
      <div className="flex flex-col items-center">
        <div className="font-mono text-4xl text-gray-900">{display}</div>
        <div className="mt-1 flex items-center">
          <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${curStatus === 'recording' ? 'bg-green-600' : curStatus === 'paused' ? 'bg-gray-400' : 'bg-red-600'}`}></span>
          <span className="text-sm text-gray-800">{curStatus === 'recording' ? 'Recording' : curStatus === 'paused' ? 'Paused' : 'Stopped'}</span>
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
            ) : curStatus === 'paused' ? (
              <Play className="w-6 h-6" />
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
        <div className="p-1 rounded-full border-2 border-dashed border-gray-300">
          <label
            className="inline-flex items-center justify-center rounded-full w-11 h-11 bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <input
              type="file"
              accept="audio/ogg,audio/webm"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUpload?.(f)
                e.currentTarget.value = ''
              }}
              className="hidden"
            />
            Upload
          </label>
        </div>
      </div>
    </div>
  )
}
