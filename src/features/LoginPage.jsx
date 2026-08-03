import { useEffect, useRef, useState } from 'react'

import { apiFetch } from '../api/http'
import { Icon, MonitorMark } from '../components/Icon'

function tokenFromLocation() {
  if (typeof window === 'undefined') return ''
  const hash = window.location.hash.replace(/^#/, '')
  return new URLSearchParams(hash).get('token') || ''
}

function clearTokenFromLocation() {
  if (typeof window === 'undefined' || !window.location.hash) return
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`,
  )
}

export function LoginPage({ onAuthenticated }) {
  const passwordRef = useRef(null)
  const [mode, setMode] = useState('viewer')
  const [viewerToken, setViewerToken] = useState(() => tokenFromLocation())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const autoSubmittedRef = useRef(false)

  async function authenticateViewer(token) {
    const response = await apiFetch('/api/auth/viewer/access', {
      method: 'POST',
      body: { token },
    })
    setViewerToken('')
    onAuthenticated(response)
  }

  useEffect(() => {
    const token = viewerToken.trim()
    if (!token || autoSubmittedRef.current) return
    autoSubmittedRef.current = true
    clearTokenFromLocation()
    setMode('viewer')
    setSubmitting(true)
    setError('')
    authenticateViewer(token)
      .catch((requestError) => {
        setError(requestError.message || 'Unable to validate the access token.')
      })
      .finally(() => setSubmitting(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'admin') {
        const password = passwordRef.current?.value || ''
        if (!password) return
        const response = await apiFetch('/api/auth/admin/login', {
          method: 'POST',
          body: { password },
        })
        if (passwordRef.current) passwordRef.current.value = ''
        onAuthenticated(response)
      } else {
        const token = viewerToken.trim()
        if (!token) return
        await authenticateViewer(token)
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to start the private session.')
      if (mode === 'admin' && passwordRef.current) {
        passwordRef.current.value = ''
        passwordRef.current.focus()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo"><MonitorMark size={58} /></div>
          <div>
            <span>PRIVATE MARKET DATA</span>
            <h1>Market Cycle Monitor</h1>
            <p>Administrators use the private password. Viewers open a temporary access link shared by an administrator.</p>
          </div>
        </div>

        <div className="login-mode-tabs" role="tablist" aria-label="Access type">
          <button type="button" className={mode === 'viewer' ? 'active' : ''} onClick={() => { setMode('viewer'); setError('') }}>
            <Icon name="key" size={17} /> Viewer access
          </button>
          <button type="button" className={mode === 'admin' ? 'active' : ''} onClick={() => { setMode('admin'); setError('') }}>
            <Icon name="shield" size={17} /> Administrator
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'admin' ? (
            <>
              <label htmlFor="monitor-password">Administrator password</label>
              <div className="password-field">
                <Icon name="lock" size={19} />
                <input
                  ref={passwordRef}
                  id="monitor-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={512}
                  disabled={submitting}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <label htmlFor="viewer-token">Temporary access token</label>
              <div className="password-field token-field">
                <Icon name="key" size={19} />
                <input
                  id="viewer-token"
                  name="token"
                  type="text"
                  value={viewerToken}
                  onChange={(event) => setViewerToken(event.target.value.toUpperCase())}
                  autoComplete="one-time-code"
                  spellCheck="false"
                  maxLength={256}
                  placeholder="MCM-XXXX-XXXX-XXXX"
                  disabled={submitting}
                  required
                />
              </div>
            </>
          )}
          {error ? <div className="login-error">{error}</div> : null}
          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'Opening session…' : mode === 'admin' ? 'Open as administrator' : 'Open as viewer'}
          </button>
        </form>

        <small className="login-note">
          The password or temporary access token is exchanged for a secure HttpOnly session cookie. It is never stored in browser storage.
        </small>
      </section>
    </main>
  )
}
