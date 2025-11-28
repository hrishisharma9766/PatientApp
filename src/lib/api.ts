import axios from 'axios'

const PROD_BASE = 'https://patientapp-server.onrender.com/api'
const baseURL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/api' : PROD_BASE)

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

