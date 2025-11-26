import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Menu } from 'lucide-react'
import PatientList from './PatientList'
import { LoginModal } from '../components/LoginModal'
import { PatientInfoPanel } from '../components/PatientInfoPanel'
import { RecordingControls } from '../components/RecordingControls'
import { TabNavigation } from '../components/TabNavigation'
import { LiveTranscription } from '../components/LiveTranscription'
import { ActionButtons } from '../components/ActionButtons'
import { PopperNotice } from '../components/PopperNotice'
import { SoapNotesModal } from '../components/SoapNotesModal'
import { SoapNotePanel } from '../components/SoapNotePanel'
import { PatientOptionsSheet } from '../components/PatientOptionsSheet'
import { useLocation } from 'react-router-dom'

type VisitPatient = { id: string, name: string, dob: string, age: number, provider?: string }

export function MainScreen() {
  const location = useLocation()
  const passed = (location.state as { patient?: VisitPatient })?.patient
  const [activeTab, setActiveTab] = useState('Dictation')
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
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const deltaChunksRef = useRef<Blob[]>([])
  const allChunksRef = useRef<Blob[]>([])
  const hasSnapshotRef = useRef<boolean>(false)

  const handleStarted = () => {
    setNoticeMessage('Recording Started')
    setNoticeVariant('started')
    setNoticeVisible(true)
    setRecordingStatus('recording')
    setSoapDismissed(false)
    hasSnapshotRef.current = false
    if (passed?.id) {
      fetch(`http://localhost:4000/api/patients/${passed.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'start' })
      }).catch(() => {})
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
            fetch(`http://localhost:4000/api/audio/${passed.id}?mode=replace`, { method: 'POST', body: fd })
              .then(() => setAudioUrl(`http://localhost:4000/api/audio/${passed.id}?t=${Date.now()}`))
              .catch(() => {})
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
      }
    }
  }

  const handlePaused = () => {
    setNoticeMessage('Recording Paused')
    setNoticeVariant('paused')
    setNoticeVisible(true)
    setRecordingStatus('paused')
    setSoapDismissed(false)
    if (passed?.id) {
      fetch(`http://localhost:4000/api/patients/${passed.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'paused' })
      }).catch(() => {})
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
          fetch(`http://localhost:4000/api/audio/${passed.id}?mode=replace`, { method: 'POST', body: fd })
            .then(() => setAudioUrl(`http://localhost:4000/api/audio/${passed.id}?t=${Date.now()}`))
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
      if (passed?.id) {
        fetch(`http://localhost:4000/api/patients/${passed.id}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'complete' })
        }).catch(() => {})
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
    }
  }

  useEffect(() => {
    if (!noticeVisible) return
    const id = setTimeout(() => setNoticeVisible(false), 3000)
    return () => clearTimeout(id)
  }, [noticeVisible])

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
          onClick={() => setLoginOpen(true)}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900"
        >
          Sign In
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
        onStarted={handleStarted}
        onPaused={handlePaused}
        onStopped={handleStopped}
      />

      {audioUrl && (
        <div className="mt-3">
          <audio src={audioUrl} controls className="w-full" crossOrigin="anonymous" />
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
          transcript={[
            { speaker: 'A', text: 'All right, Susan, let’s take a look at you here. Any changes in the eyes I need to know about? Any new floaters?' },
            { speaker: 'B', text: 'No.' },
            { speaker: 'A', text: 'Great. So let’s look at your scans of your retina, make sure that all looks okay.' },
            { speaker: 'A', text: 'So far, your scans are looking good. Let’s take a look at your...' },
          ]}
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

      {/* LOGIN MODAL */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSubmit={async () => {
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
    </div>
  )
}
