# market_cycle_monitor v0.3.1

Private React frontend for live US equity monitoring.

## Access

The login screen remains the single entry point and has two modes:

- `Viewer access`: opens automatically from a temporary link or accepts the token manually as a fallback.
- `Administrator`: existing private administrator password.

Both roles can view the complete monitor. Only `ADMIN` sees the protected Administration tab.

The Administration tab now:

- creates temporary Viewer access without an email address;
- displays the generated link only once;
- copies the link for manual sharing through a private channel;
- regenerates a link by rotating the token and selecting a new duration;
- extends or revokes access;
- terminates Viewer sessions;
- deletes inactive access records;
- displays access history by guest name.

The browser stores neither passwords nor access tokens. Authentication is maintained by the API through a Secure HttpOnly cookie. The token fragment is removed from the URL after the frontend captures it.

## Railway

The only frontend variable remains:

`VITE_MONITOR_API_BASE_URL=https://<market-cycle-monitor-api-domain>`

No credentials, symbols, email configuration, passwords or access tokens belong in this repository.

## v0.3.0

- Removes email from Viewer access creation and administration tables.
- Replaces `Resend` with `Generate new link`.
- Shows the one-time access link in a protected dialog with a copy action.
- Removes the email-specific 60-second frontend timeout.
- Keeps the 1-hour default duration and automatic Viewer login from access links.
- Requires Market Cycle Monitor API v0.3.0.


## v0.3.1

- Adds a conventional `/favicon.ico` for browser-tab compatibility.
- Adds 32x32, 192x192 and 512x512 PNG icon variants.
- Keeps the SVG icon as a modern-browser fallback.
- Adds versioned icon URLs to force browsers and CDNs to refresh cached favicons.
