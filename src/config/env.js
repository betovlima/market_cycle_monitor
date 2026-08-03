const rawApiBaseUrl = String(import.meta.env.VITE_MONITOR_API_BASE_URL || '').trim()

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')
export const APP_VERSION = '0.1.0'

export function apiUrl(path) {
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
