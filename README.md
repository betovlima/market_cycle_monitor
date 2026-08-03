# market_cycle_monitor

Private React frontend for live US equity monitoring. The browser talks only to `market_cycle_monitor_api`; Alpaca credentials and the private watchlist never exist in this repository.

## Version

`0.1.0`

## Features

- private login backed by an HttpOnly API session;
- market overview refreshed every 20 seconds;
- main intraday chart with 1D, 5D, 1M, 3M and 1Y ranges;
- private watchlist cards and live chart grid;
- market session, next open/close and provider status;
- no Alpaca key, API token, watchlist or strategy parameters in frontend source or browser storage.

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Set:

```env
VITE_MONITOR_API_BASE_URL=http://localhost:8001
```

The API must allow `http://localhost:5173` in `MONITOR_ALLOWED_ORIGINS` and use local cookies with:

```env
MONITOR_COOKIE_SECURE=false
MONITOR_COOKIE_SAMESITE=lax
```

## Railway

Configure `VITE_MONITOR_API_BASE_URL` with the HTTPS domain of `market_cycle_monitor_api`. The production API should use a Secure HttpOnly cookie. If the frontend and API are cross-site, configure `MONITOR_COOKIE_SAMESITE=none` and `MONITOR_COOKIE_SECURE=true` in the API.

## Security

Do not create any `VITE_*` variable containing Alpaca credentials, monitor passwords, session secrets or private symbols. Vite variables are public build-time values.
