const rawApiBaseUrl = String(import.meta.env.VITE_MONITOR_API_BASE_URL || '').trim()

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')
export const APP_VERSION = '0.1.1'

export function apiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_MONITOR_API_BASE_URL is not configured. Set it to the HTTPS URL of market_cycle_monitor_api and redeploy the frontend.',
    )
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
