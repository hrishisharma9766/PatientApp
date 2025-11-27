import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { X, Search, Accessibility } from 'lucide-react'

interface FindPatientModalProps {
  open: boolean
  onClose: () => void
  onCreateNew?: () => void
  onStartVisit?: (patientId: string, provider: string) => void
}

type Patient = { id: string, name: string, dob: string }

const ALL_PATIENTS: Patient[] = [
  { id: '10000', name: 'Eleanor Pena', dob: '05/15/1985' },
  { id: '100456', name: 'Elena Carter', dob: '11/20/1992' },
  { id: '210789', name: 'Eli Martinez', dob: '03/10/2001' },
]

const DEFAULT_PROVIDERS = ['Dr. Sarah Johnson', 'Dr. Robert Lee', 'Dr. Priya Kaur']

export function FindPatientModal({ open, onClose, onCreateNew, onStartVisit }: FindPatientModalProps) {
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState(DEFAULT_PROVIDERS[0])
  const [providers, setProviders] = useState<string[]>(DEFAULT_PROVIDERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dob, setDob] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hasDob = !!dob
    const mmddyyyy = (() => {
      if (!hasDob) return ''
      const [yyyy, mm, dd] = dob.split('-')
      if (!yyyy || !mm || !dd) return ''
      return `${mm}/${dd}/${yyyy}`
    })()
    const list = ALL_PATIENTS.filter(p => {
      const matchText = q ? (p.name.toLowerCase().includes(q) || p.id.includes(q)) : true
      const matchDob = hasDob ? p.dob === mmddyyyy : true
      return matchText && matchDob
    })
    return q || hasDob ? list : []
  }, [query, dob])

  useEffect(() => {
    if (!open) return
    axios.get('http://localhost:4000/api/providers')
      .then(res => {
        const list: string[] = res.data
        setProviders(list)
        setProvider(list[0] ?? DEFAULT_PROVIDERS[0])
      })
      .catch(() => {
        setProviders(DEFAULT_PROVIDERS)
        setProvider(DEFAULT_PROVIDERS[0])
      })
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="px-6 pt-10 pb-6">
            <div className="text-center text-xl font-semibold text-gray-900">Find Patient</div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
              <Search className="w-4 h-4 text-gray-600" />
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="Search by Name, DOB, Age, or ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Select Provider for this visit*</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700"
              >
                {providers.map((pr) => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Accessibility className="w-8 h-8 text-gray-700" />
                </div>
                <div className="mt-3 text-sm text-gray-600">Start Typing to search for patients.</div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filtered.map((p) => {
                  const selected = selectedId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full rounded-md border px-4 py-3 text-left ${selected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200'}`}
                    >
                      <div className="text-[15px] font-semibold text-gray-900">{p.name}</div>
                      <div className="mt-1 text-sm text-gray-600">DOB: {p.dob} | ID: {p.id}</div>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-8 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onCreateNew?.()
                }}
                className="w-full rounded-lg bg-gray-100 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Create New Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filtered.length > 0 && selectedId) {
                    onStartVisit?.(selectedId, provider)
                    onClose()
                  }
                }}
                className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Start New Visit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
