import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, apiFetch } from '../api/http'
import { Icon } from '../components/Icon'
import { formatDate, formatTime } from '../components/formatters'

const DURATION_OPTIONS = [
  [3600, '1 hour'],
  [21600, '6 hours'],
  [86400, '24 hours'],
  [259200, '3 days'],
  [604800, '7 days'],
  [2592000, '30 days'],
]

const DEFAULT_DURATION_SECONDS = String(DURATION_OPTIONS[0][0])
const INVITATION_EMAIL_TIMEOUT_MS = 60_000

function dateTime(value) {
  if (!value) return '—'
  return `${formatDate(value)} ${formatTime(value)}`
}

function statusClass(status) {
  if (status === 'active') return 'positive'
  if (status === 'delivery_failed') return 'warning-text'
  return 'negative'
}

export function AdministrationPage({ onSessionExpired }) {
  const [invitations, setInvitations] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ guest_name: '', email: '', duration_seconds: DEFAULT_DURATION_SECONDS })
  const [extendDurations, setExtendDurations] = useState({})

  const handleError = useCallback((requestError) => {
    if (requestError instanceof ApiError && requestError.status === 401) {
      onSessionExpired()
      return
    }
    setError(requestError.message || 'Unable to update invitations.')
  }, [onSessionExpired])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [invitationResponse, logResponse] = await Promise.all([
        apiFetch('/api/admin/invitations'),
        apiFetch('/api/admin/access-logs?limit=100'),
      ])
      setInvitations(invitationResponse.items || [])
      setLogs(logResponse.items || [])
      setError('')
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function createInvitation(event) {
    event.preventDefault()

    if (!form.duration_seconds) {
      setError('Select an access duration.')
      return
    }

    setBusyId('create')
    setError('')
    setNotice('')

    try {
      const created = await apiFetch('/api/admin/invitations', {
        method: 'POST',
        timeoutMs: INVITATION_EMAIL_TIMEOUT_MS,
        body: {
          guest_name: form.guest_name.trim(),
          email: form.email.trim(),
          duration_seconds: Number(form.duration_seconds),
        },
      })

      setForm({
        guest_name: '',
        email: '',
        duration_seconds: DEFAULT_DURATION_SECONDS,
      })

      setNotice(`Invitation sent to ${created.email}.`)
      await loadData()
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 502) {
        await loadData()
      }

      handleError(requestError)
    } finally {
      setBusyId('')
    }
  }

  async function runAction(id, action, message, body) {
    setBusyId(`${id}:${action}`)
    setError('')
    setNotice('')
    try {
      await apiFetch(`/api/admin/invitations/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        ...(body ? { body } : {}),
      })
      setNotice(message)
      await loadData()
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setBusyId('')
    }
  }

  async function resendInvitation(invitation) {
    const selectedDuration = extendDurations[invitation.id] ?? DEFAULT_DURATION_SECONDS
    const seconds = Number(selectedDuration)
    setBusyId(`${invitation.id}:resend`)
    setError('')
    setNotice('')
    try {
      await apiFetch(`/api/admin/invitations/${encodeURIComponent(invitation.id)}`, {
        method: 'PATCH',
        body: { duration_seconds: seconds },
      })
      await apiFetch(`/api/admin/invitations/${encodeURIComponent(invitation.id)}/resend`, {
        method: 'POST',
      })
      setNotice(`Access renewed and a new token sent to ${invitation.email}.`)
      setExtendDurations((current) => ({
        ...current,
        [invitation.id]: DEFAULT_DURATION_SECONDS,
      }))
      await loadData()
    } catch (requestError) {
      await loadData()
      handleError(requestError)
    } finally {
      setBusyId('')
    }
  }

  async function extendInvitation(invitation) {
    const selectedDuration = extendDurations[invitation.id]
    if (!selectedDuration) {
      setError('Select an extension duration.')
      return
    }
    const seconds = Number(selectedDuration)
    setBusyId(`${invitation.id}:extend`)
    setError('')
    setNotice('')
    try {
      await apiFetch(`/api/admin/invitations/${encodeURIComponent(invitation.id)}`, {
        method: 'PATCH',
        body: { duration_seconds: seconds },
      })
      setNotice(`Access extended for ${invitation.email}.`)
      setExtendDurations((current) => ({ ...current, [invitation.id]: DEFAULT_DURATION_SECONDS }))
      await loadData()
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setBusyId('')
    }
  }

  async function deleteInvitation(invitation) {
    if (!window.confirm(`Delete the invitation for ${invitation.email}?`)) return
    setBusyId(`${invitation.id}:delete`)
    setError('')
    setNotice('')
    try {
      await apiFetch(`/api/admin/invitations/${encodeURIComponent(invitation.id)}`, {
        method: 'DELETE',
      })
      setNotice(`Invitation deleted for ${invitation.email}.`)
      await loadData()
    } catch (requestError) {
      handleError(requestError)
    } finally {
      setBusyId('')
    }
  }

  const counts = useMemo(() => ({
    active: invitations.filter((item) => item.status === 'active').length,
    expired: invitations.filter((item) => item.status === 'expired').length,
    revoked: invitations.filter((item) => item.status === 'revoked').length,
  }), [invitations])

  return (
    <div className="page-stack administration-page">
      <div className="page-heading">
        <div className="page-title-icon"><Icon name="shield" size={22} /></div>
        <div><h2>Administration</h2><p>Create temporary Viewer access and review invitation activity.</p></div>
      </div>

      {error ? <div className="global-inline-message error-inline">{error}</div> : null}
      {notice ? <div className="global-inline-message success-inline">{notice}</div> : null}

      <section className="admin-summary-grid">
        <AdminSummary icon="users" label="Total invitations" value={invitations.length} />
        <AdminSummary icon="link" label="Active" value={counts.active} tone="positive" />
        <AdminSummary icon="clock" label="Expired" value={counts.expired} />
        <AdminSummary icon="lock" label="Revoked" value={counts.revoked} tone="negative" />
      </section>

      <section className="panel admin-create-panel">
        <div className="panel-heading">
          <div><span className="panel-kicker">VIEWER ACCESS</span><h2>Create invitation</h2></div>
          <span className="admin-readonly-badge"><Icon name="eye" size={14} /> Viewer · read only</span>
        </div>
        <form className="admin-invite-form" onSubmit={createInvitation}>
          <label>
            <span>Guest name</span>
            <input value={form.guest_name} onChange={(event) => setForm({ ...form, guest_name: event.target.value })} maxLength={120} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={254} required />
          </label>
          <label>
            <span>Access duration</span>
            <select
              value={form.duration_seconds}
              onChange={(event) => setForm({ ...form, duration_seconds: event.target.value })}
              required
            >
              {DURATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" className="admin-primary-button" disabled={busyId === 'create' || !form.duration_seconds}>
            <Icon name="mail" size={17} />{busyId === 'create' ? 'Sending…' : 'Create and send invitation'}
          </button>
        </form>
      </section>

      <section className="panel status-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">ACCESS CONTROL</span><h2>Invitations</h2></div></div>
        {loading ? <div className="admin-loading"><span className="loading-ring" />Loading administration…</div> : (
          <div className="table-scroll">
            <table className="market-table admin-table">
              <thead><tr><th>Guest</th><th>Role</th><th>Status</th><th>Expires</th><th>Last access</th><th>Delivery</th><th>Actions</th></tr></thead>
              <tbody>
                {invitations.length === 0 ? <tr><td colSpan="7" className="empty-table-cell">No invitations created.</td></tr> : invitations.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.guest_name}</strong><small>{item.email}</small></td>
                    <td>Viewer</td>
                    <td><span className={`admin-status ${statusClass(item.status)}`}>{item.status.replace('_', ' ')}</span></td>
                    <td>{dateTime(item.expires_at)}</td>
                    <td>{dateTime(item.last_access_at)}</td>
                    <td>{item.delivery_status}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          title="Renew access using the selected duration and send a new token."
                          onClick={() => resendInvitation(item)}
                          disabled={busyId || item.status === 'revoked'}
                        >Resend</button>
                        <select
                          value={extendDurations[item.id] ?? DEFAULT_DURATION_SECONDS}
                          onChange={(event) => setExtendDurations({ ...extendDurations, [item.id]: event.target.value })}
                          disabled={item.status === 'revoked'}
                        >
                          {DURATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>+{label}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => extendInvitation(item)}
                          disabled={busyId || item.status === 'revoked'}
                        >Extend</button>
                        <button type="button" onClick={() => runAction(item.id, 'terminate-sessions', `Viewer sessions terminated for ${item.email}.`)} disabled={busyId}>End sessions</button>
                        <button type="button" className="danger" onClick={() => runAction(item.id, 'revoke', `Access revoked for ${item.email}.`)} disabled={busyId || item.status === 'revoked'}>Revoke</button>
                        <button type="button" className="danger ghost" onClick={() => deleteInvitation(item)} disabled={busyId || item.status === 'active'}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel status-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">AUDIT</span><h2>Access history</h2></div></div>
        <div className="table-scroll">
          <table className="market-table access-log-table">
            <thead><tr><th>Time</th><th>Event</th><th>Email</th><th>Role</th><th>Result</th><th>Client</th></tr></thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan="6" className="empty-table-cell">No access events recorded.</td></tr> : logs.map((item) => (
                <tr key={item.id}>
                  <td>{dateTime(item.created_at)}</td>
                  <td>{item.event.replaceAll('_', ' ')}</td>
                  <td>{item.email || '—'}</td>
                  <td>{item.role || '—'}</td>
                  <td className={item.success ? 'positive' : 'negative'}>{item.success ? 'Success' : 'Denied'}</td>
                  <td>{item.client_ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AdminSummary({ icon, label, value, tone = '' }) {
  return (
    <article className="admin-summary-card">
      <div className={`admin-summary-icon ${tone}`}><Icon name={icon} size={20} /></div>
      <div><span>{label}</span><strong className={tone}>{value}</strong></div>
    </article>
  )
}
