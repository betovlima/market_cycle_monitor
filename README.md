# market_cycle_monitor v0.2.4

Private React frontend for live US equity monitoring.

## Access

The login screen remains the single entry point and now has two modes:

- `Viewer token`: temporary token received by email.
- `Administrator`: existing private administrator password.

Both roles can view the complete monitor. Only `ADMIN` sees the protected Administration tab.

The Administration tab creates Viewer invitations, selects the access duration, resends or rotates tokens, extends or revokes access, terminates Viewer sessions, deletes inactive invitations, and displays access history.

The browser stores neither passwords nor invitation tokens. Authentication is maintained by the API through a Secure HttpOnly cookie.

## Railway

The only frontend variable remains:

`VITE_MONITOR_API_BASE_URL=https://<market-cycle-monitor-api-domain>`

No credentials, symbols, SMTP configuration, passwords or access tokens belong in this repository.


## v0.2.1

- Removes the implicit seven-day default from invitation creation.
- Requires the administrator to choose the access duration explicitly.
- Removes the implicit seven-day default from invitation extension.
- Clears duration selections after successful operations.
- Refreshes the invitation list when email delivery fails after persistence.
- The API remains v0.2.0; `expires_at` continues to be the authoritative expiration value.


## v0.2.2

- Uses 1 hour as the default invitation duration.
- Restores the creation form to 1 hour after each successful invitation.
- Uses +1 hour as the default renewal duration for every invitation row.
- Resend now renews `expires_at` from the current time using the selected duration before rotating and sending the token.
- Administrators can still choose any other supported duration before Create, Extend or Resend.
- The API remains v0.2.0; no endpoint or persistence schema changed.


## v0.2.3

- Fixes automatic Viewer authentication from invitation links during local React StrictMode development.
- Reads the invitation token without mutating the URL during the React state initializer.
- Removes the token fragment only after the component has captured it and started validation.
- Keeps the manual token field as a fallback when a link is invalid or expired.
- The API remains v0.2.0; no endpoint, email format or MongoDB schema changed.


## v0.2.4

- Keeps the standard request timeout at 20 seconds.
- Uses a dedicated 60-second timeout only when creating invitations or resending invitation email tokens.
- Prevents the frontend from aborting invitation email operations too early on Railway.
- Preserves the 1-hour default invitation duration and invitation-link automatic login behavior.
- The API remains v0.2.0; no endpoint, email format or MongoDB schema changed.
