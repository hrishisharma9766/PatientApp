import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { CreatePatientModal } from '../components/CreatePatientModal'
import { Menu, Search, MoreVertical, Calendar, ChevronDown, ArrowLeftRight, Check, CircleDot, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FindPatientModal } from '../components/FindPatientModal'
import { PatientOptionsSheet } from '../components/PatientOptionsSheet'

export default function PatientList() {
  const navigate = useNavigate()
  const [findOpen, setFindOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dob, setDob] = useState('')
  const [status, setStatus] = useState('All Statuses')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [patients, setPatients] = useState<{ id: string, name: string, dob: string, age: number, time?: string, state?: 'idle'|'start'|'paused'|'complete' }[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:4000/api/patients')
      .then(res => {
        const data = res.data
        if (Array.isArray(data)) setPatients(data)
        else setPatients([])
      })
      .catch(() => setPatients([]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hasDob = !!dob
    const mmddyyyy = (() => {
      if (!hasDob) return ''
      const [yyyy, mm, dd] = dob.split('-')
      if (!yyyy || !mm || !dd) return ''
      return `${mm}/${dd}/${yyyy}`
    })()
    return patients.filter(p => {
      const matchText = q ? p.name.toLowerCase().includes(q) : true
      const matchDob = hasDob ? p.dob === mmddyyyy : true
      return matchText && matchDob
    })
  }, [query, dob, patients])
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">eSCRIBE</div>
            <div className="text-lg font-semibold text-[#1266cc]">eScribe</div>
          </div>
          <button className="p-2 rounded-md hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <button onClick={() => setFindOpen(true)} className="w-full rounded-lg bg-black text-white py-3 text-sm font-semibold shadow-sm">Find Patient</button>
        </div>

        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          <div className="relative flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Today</span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="relative flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
            <span className="text-sm text-gray-700">{status}</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option>All Statuses</option>
              <option>Checked In</option>
              <option>Ready</option>
              <option>Completed</option>
              <option>Dictation</option>
            </select>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
            <Search className="w-4 h-4 text-gray-600" />
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Search by Name, DOB, Age, or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {filtered.map((p) => (
            <div key={p.id || `${p.name}-${p.dob}`} className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-semibold text-gray-900">
                  {p.name} <span className="text-gray-500">| {p.time}</span>
                </div>
                <button
                  className="p-1 rounded-sm hover:bg-gray-100"
                  onClick={() => {
                    setSelectedPatient(`${p.name} | DOB: ${p.dob}`)
                    setSheetOpen(true)
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-gray-600">DOB: {p.dob} ({p.age}y)</div>
                <div className="flex items-center gap-3">
                  {p.state === 'idle' && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-black"><Mic className="w-4 h-4" /></span>
                  )}
                  {p.state === 'paused' && (
                    <>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600"><ArrowLeftRight className="w-4 h-4" /></span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600"><CircleDot className="w-4 h-4" /></span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600"><Mic className="w-4 h-4" /></span>
                    </>
                  )}
                  {p.state === 'start' && (
                    <>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600"><ArrowLeftRight className="w-4 h-4" /></span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600"><Check className="w-4 h-4" /></span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600"><Mic className="w-4 h-4" /></span>
                    </>
                  )}
                  {p.state === 'complete' && (
                    <>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600"><ArrowLeftRight className="w-4 h-4" /></span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Mic className="w-4 h-4" /></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <PatientOptionsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onCopy={() => {
            navigator.clipboard.writeText(selectedPatient)
            setSheetOpen(false)
          }}
          onSavePdf={() => {
            setSheetOpen(false)
            alert('Save PDF')
          }}
          onTransfer={() => {
            setSheetOpen(false)
            alert('Transfer to EHR')
          }}
        />
        <FindPatientModal
          open={findOpen}
          onClose={() => setFindOpen(false)}
          onCreateNew={() => setCreateOpen(true)}
          onStartVisit={(patientId, provider) => {
            setFindOpen(false)
            const p = patients.find(x => String(x.id) === patientId)
            navigate('/record', { state: { patient: p ? { ...p, provider } : { id: patientId, name: '', dob: '', age: 0, provider } } })
          }}
        />
        <CreatePatientModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(created) => {
            setPatients(prev => [created, ...prev])
            setCreateOpen(false)
            setFindOpen(false)
          }}
        />
      </div>
    </div>
  )
}
