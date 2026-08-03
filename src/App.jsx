import { useEffect, useState } from 'react'

import { apiFetch } from './api/http'
import { LoginPage } from './features/LoginPage'
import { MonitorApp } from './features/MonitorApp'

export default function App() {
  const [sessionState, setSessionState] = useState('checking')
  const [session, setSession] = useState(null)
  const [startupError, setStartupError] = useState('')

  useEffect(() => {
    let active = true
    apiFetch('/api/auth/session')
      .then((response) => {
        if (!active) return
        if (response?.authenticated) {
          setSession(response)
          setSessionState('authenticated')
        } else {
          setSession(null)
          setSessionState('anonymous')
        }
      })
      .catch((error) => {
        if (!active) return
        setStartupError(error.message || 'Unable to connect to the monitor API.')
        setSession(null)
        setSessionState('anonymous')
      })
    return () => {
      active = false
    }
  }, [])

  function handleAuthenticated(nextSession) {
    setStartupError('')
    setSession(nextSession)
    setSessionState('authenticated')
  }

  function handleSessionExpired() {
    setSession(null)
    setSessionState('anonymous')
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      handleSessionExpired()
    }
  }

  if (sessionState === 'checking') {
    return <div className="app-loading"><span className="loading-ring" />Checking private session…</div>
  }

  if (sessionState !== 'authenticated' || !session) {
    return (
      <>
        {startupError ? <div className="startup-error">{startupError}</div> : null}
        <LoginPage onAuthenticated={handleAuthenticated} />
      </>
    )
  }

  return (
    <MonitorApp
      session={session}
      onLogout={handleLogout}
      onSessionExpired={handleSessionExpired}
    />
  )
}
