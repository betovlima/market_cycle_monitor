import { useRef, useState } from 'react'

import { apiFetch } from '../api/http'
import { Icon, MonitorMark } from '../components/Icon'

export function LoginPage({ onAuthenticated }) {
  const passwordRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const password = passwordRef.current?.value || ''
    if (!password) return
    setSubmitting(true)
    setError('')
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { password },
      })
      if (passwordRef.current) passwordRef.current.value = ''
      onAuthenticated()
    } catch (requestError) {
      setError(requestError.message || 'Unable to start the private session.')
      if (passwordRef.current) {
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
            <p>Live market monitoring without exposing provider credentials in the browser.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="monitor-password">Access password</label>
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
          {error ? <div className="login-error">{error}</div> : null}
          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'Opening session…' : 'Open private monitor'}
          </button>
        </form>

        <small className="login-note">The password is submitted once and replaced by a secure HttpOnly session cookie.</small>
      </section>
    </main>
  )
}
