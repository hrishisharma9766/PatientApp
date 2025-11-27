interface ReplaceRecordingModalProps {
  open: boolean
  onCancel: () => void
  onStart: () => void
}

export function ReplaceRecordingModal({ open, onCancel, onStart }: ReplaceRecordingModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel}></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
          <div className="px-6 pt-10 pb-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">!</div>
              <div className="mt-3 text-lg font-semibold text-gray-900">Visit Already Finalized</div>
              <div className="mt-2 text-sm text-gray-600">This visit note has already been finalized. Do you want to start a new recording and overwrite the existing one?</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={onCancel} className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-900">Cancel</button>
              <button type="button" onClick={onStart} className="w-full rounded-lg bg-blue-100 py-3 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-200">Start Recording</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
