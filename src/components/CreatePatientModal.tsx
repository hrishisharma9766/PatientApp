import { useState } from 'react'
import { Calendar } from 'lucide-react'
import axios from 'axios'

interface CreatePatientModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (patient: { id: string, name: string, dob: string, age: number, time?: string, state?: string }) => void
}

const GENDERS = ['Female','Male','Other']
const LOCATIONS = ['Beaverton','Hillsboro','Portland']

export function CreatePatientModal({ open, onClose, onCreated }: CreatePatientModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState(GENDERS[0])
  const [location, setLocation] = useState(LOCATIONS[0])
  const [saving, setSaving] = useState(false)
  if (!open) return null

  const mmddyyyy = (() => {
    if (!dob) return ''
    const [yyyy, mm, dd] = dob.split('-')
    if (!yyyy || !mm || !dd) return ''
    return `${mm}/${dd}/${yyyy}`
  })()

  const age = (() => {
    if (!dob) return 0
    const y = Number(dob.split('-')[0] || '0')
    const now = new Date().getFullYear()
    return now - y
  })()

  const disabled = !firstName || !lastName || !dob || saving

  const save = async () => {
    try {
      setSaving(true)
      const id = String(Date.now()).slice(-6)
      const name = `${firstName} ${lastName}`.trim()
      const body = { id, name, dob: mmddyyyy, age, time: '', state: 'idle' }
      const res = await axios.post('http://localhost:4000/api/patients', body)
      const created = res.data
      onCreated?.(created)
    } catch {
      onClose()
    } finally {
      setSaving(false)
    }
  }

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
            ×
          </button>
          <div className="px-6 pt-10 pb-6">
            <div className="text-center text-xl font-semibold text-gray-900">Create Patient</div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                <input
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                <input
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="text-xs text-gray-500">{mmddyyyy || 'MM/DD/YYYY'}</div>
              <div className="relative flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                <span className="text-sm text-gray-700">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {GENDERS.map(g => (<option key={g}>{g}</option>))}
                </select>
                <span className="ml-auto text-sm text-gray-700">{gender}</span>
              </div>
              <div className="relative flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                <span className="text-sm text-gray-700">Practice Location</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {LOCATIONS.map(l => (<option key={l}>{l}</option>))}
                </select>
                <span className="ml-auto text-sm text-gray-700">{location}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={save}
              className="mt-8 w-full rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 disabled:opacity-60"
            >
              Save Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
