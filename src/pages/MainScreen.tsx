import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { ArrowLeft, Menu } from 'lucide-react'
import PatientList from './PatientList'
import { LoginModal } from '../components/LoginModal'
import { useAuth } from '../context/useAuth'
import { PatientInfoPanel } from '../components/PatientInfoPanel'
import { RecordingControls } from '../components/RecordingControls'
import { TabNavigation } from '../components/TabNavigation'
import { LiveTranscription } from '../components/LiveTranscription'
import { ActionButtons } from '../components/ActionButtons'
import { PopperNotice } from '../components/PopperNotice'
import { SoapNotesModal } from '../components/SoapNotesModal'
import { SoapNotePanel } from '../components/SoapNotePanel'
import { PatientOptionsSheet } from '../components/PatientOptionsSheet'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReplaceRecordingModal } from '../components/ReplaceRecordingModal'

type VisitPatient = { id: string, name: string, dob: string, age: number, provider?: string }

export function MainScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const passed = (location.state as { patient?: VisitPatient })?.patient
  const [activeTab, setActiveTab] = useState('Dictation')
  const { user, signIn, signOut } = useAuth()
  const [noticeVisible, setNoticeVisible] = useState(false)
  const [noticeMessage, setNoticeMessage] = useState('')
  const [noticeVariant, setNoticeVariant] = useState<'started' | 'paused' | 'stopped'>('started')

  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle')

  const isRecording = recordingStatus === 'recording'

  const [soapOpen, setSoapOpen] = useState(false)
  const [soapDismissed, setSoapDismissed] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [showPatients, setShowPatients] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const prevAudioUrlRef = useRef<string | null>(null)
  const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [, setPendingOverwrite] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const deltaChunksRef = useRef<Blob[]>([])
  const allChunksRef = useRef<Blob[]>([])
  const hasSnapshotRef = useRef<boolean>(false)
  const serverAudioRef = useRef<boolean>(false)
  const sessionStartedRef = useRef<boolean>(false)

  const handleStarted = (force?: boolean) => {
    const isIdleOrPaused = recordingStatus === 'idle' || recordingStatus === 'stopped' || recordingStatus === 'paused'
    const shouldPromptOverwrite = !force && serverAudioRef.current && !sessionStartedRef.current && isIdleOrPaused
    if (shouldPromptOverwrite) {
      setReplaceOpen(true)
      return
    }
    setNoticeMessage('Recording Started')
    setNoticeVariant('started')
    setNoticeVisible(true)
    setRecordingStatus('recording')
    setSoapDismissed(false)
    hasSnapshotRef.current = false
    sessionStartedRef.current = true
    if (!user) { setLoginOpen(true); return }
    if (passed?.id) {
      api.patch(`/patients/${passed.id}/state`, { state: 'start' }).catch(() => {})
    }
    if (!recorder) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(ms => {
        setStream(ms)
        const desired = 'audio/ogg;codecs=opus'
        const fallback = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
        const chosen = MediaRecorder.isTypeSupported(desired) ? desired : fallback
        const rec = new MediaRecorder(ms, { mimeType: chosen })
        rec.ondataavailable = e => {
          if (e.data && e.data.size > 0) {
            deltaChunksRef.current.push(e.data)
            allChunksRef.current.push(e.data)
          }
        }
        rec.onstop = () => {
          const mime = rec.mimeType || ''
          const blobType = mime.includes('ogg') ? 'audio/ogg' : 'audio/webm'
          const full = new Blob(allChunksRef.current, { type: blobType })
          if (passed?.id && full.size > 0) {
            const fd = new FormData()
            fd.append('file', full, `${passed.id}.${blobType.includes('ogg') ? 'ogg' : 'webm'}`)
            setUploading(true)
            api.post(`/audio/${passed.id}/transcribe`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: false })
              .then(async (res) => {
                const prev = prevAudioUrlRef.current
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
                const url = URL.createObjectURL(full)
                setAudioUrl(url)
                prevAudioUrlRef.current = url
                let text = res?.data?.transcription || ''
                for (let i = 0; i < 300; i++) {
                  const tr = await api.get(`/audio/${passed.id}/transcription`, { params: { t: Date.now() } })
                  text = text || tr.data?.transcription || ''
                  if (text) break
                  await new Promise(r => setTimeout(r, 1000))
                }
                setTranscript(text ? text.split(/\n+/).map((line: string) => ({ speaker: 'A', text: line })) : [])
                setUploading(false)
              })
              .catch(() => { setUploading(false) })
          }
          deltaChunksRef.current = []
          allChunksRef.current = []
          hasSnapshotRef.current = false
        }
        setRecorder(rec)
        deltaChunksRef.current = []
        allChunksRef.current = []
        rec.start()
      }).catch(() => {})
    } else {
      if (recorder.state === 'paused') {
        recorder.resume()
      } else if (recorder.state === 'inactive') {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(ms => {
          setStream(ms)
          const desired = 'audio/ogg;codecs=opus'
          const fallback = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
          const chosen = MediaRecorder.isTypeSupported(desired) ? desired : fallback
          const rec = new MediaRecorder(ms, { mimeType: chosen })
          rec.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
              deltaChunksRef.current.push(e.data)
              allChunksRef.current.push(e.data)
            }
          }
          rec.onstop = () => {
            const mime = rec.mimeType || ''
            const blobType = mime.includes('ogg') ? 'audio/ogg' : 'audio/webm'
            const full = new Blob(allChunksRef.current, { type: blobType })
            if (passed?.id && full.size > 0) {
              const fd = new FormData()
              fd.append('file', full, `${passed.id}.${blobType.includes('ogg') ? 'ogg' : 'webm'}`)
              setUploading(true)
              api.post(`/audio/${passed.id}/transcribe`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: false })
                .then(async (res) => {
                  const prev = prevAudioUrlRef.current
                  if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
                  const url = URL.createObjectURL(full)
                  setAudioUrl(url)
                  prevAudioUrlRef.current = url
                  let text = res?.data?.transcription || ''
                  for (let i = 0; i < 300; i++) {
                    const tr = await api.get(`/audio/${passed.id}/transcription`, { params: { t: Date.now() } })
                    text = text || tr.data?.transcription || ''
                    if (text) break
                    await new Promise(r => setTimeout(r, 1000))
                  }
                  setTranscript(text ? text.split(/\n+/).map((line: string) => ({ speaker: 'A', text: line })) : [])
                  setUploading(false)
                })
                .catch(() => { setUploading(false) })
            }
            deltaChunksRef.current = []
            allChunksRef.current = []
            hasSnapshotRef.current = false
          }
          setRecorder(rec)
          deltaChunksRef.current = []
          allChunksRef.current = []
          rec.start()
        }).catch(() => {})
      }
    }
  }

  const handlePaused = () => {
    setNoticeMessage('Recording Paused')
    setNoticeVariant('paused')
    setNoticeVisible(true)
    setRecordingStatus('paused')
    setSoapDismissed(false)
    if (!user) { setLoginOpen(true); return }
    if (passed?.id) {
      api.patch(`/patients/${passed.id}/state`, { state: 'paused' }).catch(() => {})
    }
    if (recorder && recorder.state === 'recording') {
      recorder.pause()
      recorder.requestData()
      setTimeout(() => {
        const mime = recorder && 'mimeType' in recorder ? (recorder as MediaRecorder).mimeType : ''
        const blobType = mime.includes('ogg') ? 'audio/ogg' : 'audio/webm'
        const full = new Blob(allChunksRef.current, { type: blobType })
          if (passed?.id && full.size > 0) {
            const fd = new FormData()
            fd.append('file', full, `${passed.id}.${blobType.includes('ogg') ? 'ogg' : 'webm'}`)
            api.post(`/audio/${passed.id}?mode=replace`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
              .then(async () => {
                try {
                  const res = await api.get(`/audio/${passed.id}`, { responseType: 'blob', params: { t: Date.now() } })
                  const url = URL.createObjectURL(res.data as Blob)
                  const prev = prevAudioUrlRef.current
                  if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
                  setAudioUrl(url)
                  prevAudioUrlRef.current = url
                } catch { void 0 }
              })
              .catch(() => {})
            hasSnapshotRef.current = true
            deltaChunksRef.current = []
          }
      }, 200)
    }
  }

  const handleStopped = () => {
    if (recordingStatus !== 'stopped') {
      setNoticeMessage('Recording Stopped')
      setNoticeVariant('stopped')
      setNoticeVisible(true)
      setRecordingStatus('stopped')
      if (!soapDismissed && !soapOpen) {
        setSoapOpen(true)
      }
      if (!user) { setLoginOpen(true); return }
      if (passed?.id) {
        api.patch(`/patients/${passed.id}/state`, { state: 'complete' }).catch(() => {})
      }
      if (recorder) {
        try { if (recorder.state !== 'inactive') recorder.requestData() } catch { /* ignore */ }
        if (recorder.state !== 'inactive') recorder.stop()
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
        setStream(null)
      }
      // final upload now occurs in recorder.onstop
      sessionStartedRef.current = false
      serverAudioRef.current = true
    }
  }

  useEffect(() => {
    if (!noticeVisible) return
    const id = setTimeout(() => setNoticeVisible(false), 3000)
    return () => clearTimeout(id)
  }, [noticeVisible])

  useEffect(() => {
    if (!passed?.id) return
    api.get(`/audio/${passed.id}`, { responseType: 'blob' })
      .then(async res => {
        const blob = res.data as Blob
        const url = URL.createObjectURL(blob)
        const prev = prevAudioUrlRef.current
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
        setAudioUrl(url)
        prevAudioUrlRef.current = url
        setRecordingStatus('paused')
        serverAudioRef.current = true
        try {
          const tr = await api.get(`/audio/${passed.id}/transcription`, { params: { t: Date.now() } })
          const text = tr.data?.transcription || ''
          setTranscript(text ? text.split(/\n+/).map((line: string) => ({ speaker: 'A', text: line })) : [])
        } catch { setTranscript([]) }
      })
      .catch(() => {
        setAudioUrl(null)
        setRecordingStatus('idle')
        serverAudioRef.current = false
        setTranscript([])
      })
  }, [passed?.id])

  if (showPatients) {
    return <PatientList />
  }

  return (
    <div className="max-w-sm mx-auto p-4 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Back"
          className="inline-flex items-center justify-center rounded-full w-9 h-9 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-lg font-bold text-blue-600">eScribe</div>

        <button
          type="button"
          aria-label="Menu"
          className="inline-flex items-center justify-center rounded-full w-9 h-9 text-gray-600 hover:text-gray-800"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* SIGN IN */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={async () => {
            if (user) {
              await signOut()
              setShowPatients(false)
              navigate('/')
            } else {
              setLoginOpen(true)
            }
          }}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900"
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>

      {/* PATIENT PANEL */}
      <PatientInfoPanel
        className="mt-4"
        patientName={passed?.name ?? 'Eleanor Pena'}
        dob={passed?.dob ?? '05/15/1985'}
        age={passed?.age ?? 38}
        id={passed?.id ?? '10000'}
        provider={passed?.provider ?? 'Dr. Sarah Jones'}
        onMenuClick={() => setOptionsOpen(true)}
      />

      {/* TOAST / NOTICE */}
      <PopperNotice
        visible={noticeVisible}
        message={noticeMessage}
        variant={noticeVariant}
        onClose={() => setNoticeVisible(false)}
        inContainer={true}
      />

      {/* RECORDING CONTROLS (FIXED) */}
      <RecordingControls
        status={recordingStatus}
        timer="00:00"
        onStarted={() => handleStarted()}
        onPaused={handlePaused}
        onStopped={handleStopped}
        onUpload={async (file) => {
          try {
            if (!passed?.id) return
            const fd = new FormData()
            fd.append('file', file, file.name)
            setUploading(true)
            const res = await api.post(`/audio/${passed.id}/transcribe`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: false })
            const url = URL.createObjectURL(file)
            const prev = prevAudioUrlRef.current
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
            setAudioUrl(url)
            prevAudioUrlRef.current = url
            let text = res?.data?.transcription || ''
            for (let i = 0; i < 300; i++) {
              const tr = await api.get(`/audio/${passed.id}/transcription`, { params: { t: Date.now() } })
              text = text || tr.data?.transcription || ''
              if (text) break
              await new Promise(r => setTimeout(r, 1000))
            }
            setTranscript(text ? text.split(/\n+/).map((line: string) => ({ speaker: 'A', text: line })) : [])
            setUploading(false)
          } catch {}
        }}
      />

      {audioUrl && (
        <div className="mt-3">
          <audio key={audioUrl} src={audioUrl} controls className="w-full" crossOrigin="anonymous" />
        </div>
      )}

      {/* TABS */}
      <TabNavigation
        tabs={["Dictation", "SOAP Note"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRecording={isRecording}
      />

      {/* DICTATION OR SOAP NOTE */}
      {activeTab === 'Dictation' ? (
        <LiveTranscription
          status={isRecording ? 'Live' : 'Offline'}
          transcript={transcript}
        />
      ) : (
        <SoapNotePanel />
      )}

      {/* SOAP NOTES MODAL */}
      {soapOpen && (
        <SoapNotesModal
          open={soapOpen}
          onClose={() => {
            setSoapOpen(false)
            setRecordingStatus('idle')
            setSoapDismissed(true)
          }}
        />
      )}

      <ReplaceRecordingModal
        open={replaceOpen}
        onCancel={() => {
          setPendingOverwrite(false)
          setReplaceOpen(false)
        }}
        onStart={() => {
          setPendingOverwrite(false)
          setReplaceOpen(false)
          setRecordingStatus('idle')
          setAudioUrl(null)
          serverAudioRef.current = false
          sessionStartedRef.current = true
          setTimeout(() => handleStarted(true), 0)
        }}
      />

      {/* LOGIN MODAL */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSubmit={async (email, password) => {
          await signIn(email, password)
          setLoginOpen(false)
          setShowPatients(true)
        }}
      />

      {/* PATIENT OPTIONS SHEET */}
      <PatientOptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onCopy={() => {
          navigator.clipboard.writeText(
            'Patient: Eleanor Pena, ID: 10000, Provider: Dr. Sarah Jones'
          )
          setOptionsOpen(false)
        }}
        onSavePdf={() => {
          setOptionsOpen(false)
          alert('Save PDF')
        }}
        onTransfer={() => {
          setOptionsOpen(false)
          alert('Transfer to EHR')
        }}
      />

      {/* FOOTER ACTION BUTTONS */}
      <ActionButtons buttons={["Finalize", "Transfer"]} />
      {uploading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-4 shadow-lg w-64 text-center">
            <div className="animate-pulse text-gray-800 font-semibold">Generating SOAP...</div>
            <div className="mt-2 text-xs text-gray-600">Saving audio and transcription</div>
          </div>
        </div>
      )}
    </div>
  )
}
