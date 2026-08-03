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
    const response = await fetch(apiUrl(path), {
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

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null

    if (!response.ok) {
      const message = payload?.detail || `Request failed with status ${response.status}.`
      throw new ApiError(message, response.status)
    }
    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      if (options.signal?.aborted) throw error
      throw new ApiError('The request timed out.', 0)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
