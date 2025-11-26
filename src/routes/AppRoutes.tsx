import { Routes, Route, Navigate } from 'react-router-dom'
import SignIn from '../pages/SignIn'
import PatientList from '../pages/PatientList'
import { MainScreen } from '../pages/MainScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/patients" element={<PatientList />} />
      <Route path="/record" element={<MainScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
