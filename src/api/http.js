import { apiUrl } from '../config/env'

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || 20_000)

  try {
    let requestUrl
    try {
      requestUrl = apiUrl(path)
    } catch (configurationError) {
      throw new ApiError(configurationError.message, 0)
    }

    const response = await fetch(requestUrl, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      signal: options.signal || controller.signal,
      body:
        options.body && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body,
    })

    if (response.status === 204) return null

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.toLowerCase().includes('application/json')
    const payload = isJson ? await response.json() : null

    if (!response.ok) {
      const message = payload?.detail || `Request failed with status ${response.status}.`
      throw new ApiError(message, response.status)
    }

    if (!isJson || payload === null) {
      throw new ApiError(
        'The monitor API returned an invalid response. Check VITE_MONITOR_API_BASE_URL in Railway and redeploy the frontend.',
        response.status,
      )
    }

    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      if (options.signal?.aborted) throw error
      throw new ApiError('The request timed out.', 0)
    }
    if (error instanceof ApiError) throw error
    throw new ApiError(error?.message || 'Unable to connect to the monitor API.', 0)
  } finally {
    window.clearTimeout(timeoutId)
  }
}
