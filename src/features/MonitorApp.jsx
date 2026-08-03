import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError, apiFetch } from '../api/http'
import {
  formatClockDuration,
  formatCompact,
  formatDate,
  formatMoney,
  formatPercent,
  formatTime,
} from '../components/formatters'
import { Icon, MonitorMark } from '../components/Icon'
import { MarketChart } from '../components/MarketChart'
import { MetricCard } from '../components/MetricCard'
import { AdministrationPage } from './AdministrationPage'
import { APP_VERSION } from '../config/env'

const RANGE_OPTIONS = [
  ['1d', '1D'],
  ['5d', '5D'],
  ['1m', '1M'],
  ['3m', '3M'],
  ['1y', '1Y'],
]

export function MonitorApp({ session, onLogout, onSessionExpired }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [selectedRange, setSelectedRange] = useState('1d')
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const loadingRef = useRef(false)

  const handleApiError = useCallback((requestError) => {
    if (requestError instanceof ApiError && requestError.status === 401) {
      onSessionExpired()
      return true
    }
    setError(requestError.message || 'Unable to update market data.')
    return false
  }, [onSessionExpired])

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (!silent) setLoading(true)
    try {
      const response = await apiFetch('/api/market/overview')
      if (!response || !Array.isArray(response.items) || !response.market || !response.summary) {
        throw new ApiError(
          'The monitor API returned an unexpected overview response.',
          502,
        )
      }
      setOverview(response)
      setError('')
      setSelectedSymbol((current) => {
        if (current && response.items.some((item) => item.symbol === current)) return current
        return response.items[0]?.symbol || ''
      })
    } catch (requestError) {
      handleApiError(requestError)
    } finally {
      loadingRef.current = false
      if (!silent) setLoading(false)
    }
  }, [handleApiError])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const refreshSeconds = overview?.refresh_seconds || 20
  useEffect(() => {
    const intervalId = window.setInterval(
      () => loadOverview({ silent: true }),
      refreshSeconds * 1000,
    )
    return () => window.clearInterval(intervalId)
  }, [loadOverview, refreshSeconds])

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!selectedSymbol || selectedRange === '1d') {
      setHistory(null)
      setHistoryLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setHistoryLoading(true)
    apiFetch(
      `/api/market/assets/${encodeURIComponent(selectedSymbol)}/history?range=${selectedRange}`,
      { signal: controller.signal },
    )
      .then((response) => {
        setHistory(response)
        setError('')
      })
      .catch((requestError) => {
        if (requestError?.name !== 'AbortError') handleApiError(requestError)
      })
      .finally(() => setHistoryLoading(false))

    return () => controller.abort()
  }, [selectedRange, selectedSymbol, handleApiError])

  const selectedAsset = useMemo(
    () => overview?.items?.find((item) => item.symbol === selectedSymbol) || overview?.items?.[0] || null,
    [overview, selectedSymbol],
  )
  const selectedPoints = selectedRange === '1d'
    ? selectedAsset?.points || []
    : history?.symbol === selectedSymbol && history?.range === selectedRange
      ? history.points || []
      : []

  const nextRefreshSeconds = overview?.next_refresh_at
    ? Math.max(0, Math.ceil((new Date(overview.next_refresh_at).getTime() - now) / 1000))
    : refreshSeconds

  return (
    <div className="monitor-frame">
      <MonitorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        nextRefreshSeconds={nextRefreshSeconds}
        now={now}
        overview={overview}
        session={session}
      />

      {error ? (
        <div className="global-banner error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => loadOverview()}>Retry</button>
        </div>
      ) : null}
      {overview?.stale ? (
        <div className="global-banner stale-banner">Showing the latest cached market snapshot.</div>
      ) : null}

      <main className="monitor-main">
        {loading && !overview ? <LoadingPanel /> : null}
        {overview && activeTab === 'overview' ? (
          <OverviewPage
            overview={overview}
            selectedAsset={selectedAsset}
            selectedSymbol={selectedSymbol}
            selectedRange={selectedRange}
            selectedPoints={selectedPoints}
            historyLoading={historyLoading}
            onSelectSymbol={setSelectedSymbol}
            onSelectRange={setSelectedRange}
          />
        ) : null}
        {overview && activeTab === 'charts' ? <LiveChartsPage overview={overview} /> : null}
        {overview && activeTab === 'status' ? <MarketStatusPage overview={overview} /> : null}
        {session.role === 'admin' && activeTab === 'admin' ? <AdministrationPage onSessionExpired={onSessionExpired} /> : null}
      </main>

      <footer className="monitor-footer">
        <span>Market Cycle Monitor</span>
        <span>Private market-data application · v{APP_VERSION}</span>
      </footer>
    </div>
  )
}

function MonitorHeader({ activeTab, onTabChange, onLogout, nextRefreshSeconds, now, overview, session }) {
  const tabs = [
    ['overview', 'grid', 'Overview'],
    ['charts', 'chart', 'Live Charts'],
    ['status', 'status', 'Market Status'],
    ...(session.role === 'admin' ? [['admin', 'shield', 'Administration']] : []),
  ]
  return (
    <header className="monitor-header">
      <div className="monitor-brand">
        <MonitorMark size={50} />
        <div>
          <h1>Market Cycle Monitor</h1>
          <p>Private live market monitoring</p>
        </div>
      </div>

      <nav className="monitor-nav" aria-label="Primary navigation">
        {tabs.map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? 'active' : ''}
            onClick={() => onTabChange(id)}
          >
            <Icon name={icon} size={18} />{label}
          </button>
        ))}
      </nav>

      <div className="monitor-actions">
        <HeaderClock
          icon="globe"
          label="Local Time"
          now={now}
          helper="Device time"
        />
        <HeaderClock
          icon="building"
          label="New York Market"
          now={now}
          timeZone="America/New_York"
          helper="Eastern Time"
        />
        <span className="status-pill private"><Icon name={session.role === 'admin' ? 'shield' : 'eye'} size={15} />{session.role === 'admin' ? 'Administrator' : 'Viewer'}</span>
        <span className="status-pill connected"><Icon name="link" size={15} />API Connected</span>
        <span className="status-pill countdown"><Icon name="clock" size={15} />Next update {formatClockDuration(nextRefreshSeconds)}</span>
        <button type="button" className="logout-button" onClick={onLogout} aria-label="Log out">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  )
}


function HeaderClock({ icon, label, now, timeZone, helper }) {
  const date = new Date(now)
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  }
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }

  return (
    <div className="header-clock" aria-label={`${label}: ${new Intl.DateTimeFormat('en-US', timeOptions).format(date)}`}>
      <div className="header-clock-icon"><Icon name={icon} size={18} /></div>
      <div className="header-clock-copy">
        <span>{label}</span>
        <strong>{new Intl.DateTimeFormat('en-US', timeOptions).format(date)}</strong>
        <small>{helper} · {new Intl.DateTimeFormat('en-US', dateOptions).format(date)}</small>
      </div>
    </div>
  )
}

function OverviewPage({
  overview,
  selectedAsset,
  selectedSymbol,
  selectedRange,
  selectedPoints,
  historyLoading,
  onSelectSymbol,
  onSelectRange,
}) {
  const market = overview.market
  const summary = overview.summary
  const marketCountdown = market.is_open ? market.seconds_to_close : market.seconds_to_open
  const marketCountdownLabel = market.is_open ? 'Time to close' : 'Time to open'
  const marketStatus = market.is_open
    ? { icon: 'building', value: 'Open', tone: 'green' }
    : { icon: 'lock', value: 'Closed', tone: 'red' }

  return (
    <div className="overview-stack">
      <section className="metrics-grid five-columns">
        <MetricCard icon={marketStatus.icon} label="Market Status" value={marketStatus.value} helper={market.session_label} tone={marketStatus.tone} />
        <MetricCard icon="pie" label="Monitored Assets" value={summary.monitored_assets} helper="Private watchlist" tone="blue" />
        <MetricCard icon="up" label="Advancers" value={summary.advancers} helper={`${percentageOf(summary.advancers, summary.monitored_assets)} of assets`} tone="green" />
        <MetricCard icon="down" label="Decliners" value={summary.decliners} helper={`${percentageOf(summary.decliners, summary.monitored_assets)} of assets`} tone="red" />
        <MetricCard icon="clock" label="Last Update" value={formatTime(overview.generated_at)} helper={formatDate(overview.generated_at)} tone="blue" />
      </section>

      <section className="overview-grid">
        <article className="panel live-panel">
          <div className="panel-heading live-heading">
            <div>
              <span className="panel-kicker">LIVE CHART</span>
              <h2>{selectedSymbol || 'Market asset'}</h2>
            </div>
            <div className="chart-controls">
              <select value={selectedSymbol} onChange={(event) => onSelectSymbol(event.target.value)} aria-label="Select asset">
                {(overview.items || []).map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol}</option>)}
              </select>
              <div className="range-tabs" aria-label="Chart range">
                {RANGE_OPTIONS.map(([id, label]) => (
                  <button key={id} type="button" className={selectedRange === id ? 'active' : ''} onClick={() => onSelectRange(id)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {selectedAsset ? (
            <div className="quote-strip">
              <QuoteValue label="Price" value={formatMoney(selectedAsset.price)} />
              <QuoteValue label="Change" value={formatPercent(selectedAsset.change_percent)} tone={selectedAsset.change_percent >= 0 ? 'positive' : 'negative'} />
              <QuoteValue label="High" value={formatMoney(selectedAsset.high)} />
              <QuoteValue label="Low" value={formatMoney(selectedAsset.low)} />
              <QuoteValue label="Volume" value={formatCompact(selectedAsset.volume)} />
            </div>
          ) : null}

          <div className="main-chart-wrap">
            {historyLoading ? <div className="chart-loading"><span className="loading-ring" />Loading chart…</div> : (
              <MarketChart
                points={selectedPoints}
                previousClose={selectedRange === '1d' ? selectedAsset?.previous_close : null}
                range={selectedRange}
              />
            )}
          </div>
        </article>

        <article className="panel watchlist-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">PRIVATE WATCHLIST</span><h2>Market Snapshot</h2></div>
            <span className="feed-badge">{String(overview.feed).toUpperCase()}</span>
          </div>
          <div className="watchlist-grid">
            {(overview.items || []).map((item) => (
              <button key={item.symbol} type="button" className={`watch-card ${item.symbol === selectedSymbol ? 'selected' : ''}`} onClick={() => onSelectSymbol(item.symbol)}>
                <div className="watch-card-heading">
                  <strong>{item.symbol}</strong>
                  <span className={item.change_percent >= 0 ? 'positive' : 'negative'}>{formatPercent(item.change_percent)}</span>
                </div>
                <b>{formatMoney(item.price)}</b>
                <MarketChart points={item.points} compact trendPositive={item.change_percent >= 0} />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="panel market-strip">
        <div><span>Data feed</span><strong className="positive">Real-time {String(overview.feed).toUpperCase()}</strong><small>{overview.stale ? 'Cached snapshot' : 'Operational'}</small></div>
        <div><span>Last refresh</span><strong>{formatTime(overview.generated_at)}</strong><small>{formatDate(overview.generated_at)}</small></div>
        <div><span>Next refresh</span><strong>{formatTime(overview.next_refresh_at)}</strong><small>Every {overview.refresh_seconds} seconds</small></div>
        <div><span>Market session</span><strong className={market.is_open ? 'positive' : ''}>{market.session_label}</strong><small>{market.is_open ? 'Regular trading hours' : 'Waiting for next session'}</small></div>
        <div><span>Market time</span><strong>{formatTime(market.timestamp, { withZone: true })}</strong><small>{formatDate(market.timestamp)}</small></div>
        <div><span>{marketCountdownLabel}</span><strong className="accent-text">{formatClockDuration(marketCountdown)}</strong><small>{market.is_open ? `Closes ${formatTime(market.next_close, { withSeconds: false })}` : `Opens ${formatTime(market.next_open, { withSeconds: false })}`}</small></div>
      </section>
    </div>
  )
}

function LiveChartsPage({ overview }) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="page-title-icon"><Icon name="chart" size={22} /></div>
        <div><h2>Live Charts</h2><p>Intraday evolution for every asset in the private watchlist.</p></div>
      </div>
      <section className="live-charts-grid">
        {(overview.items || []).map((item) => (
          <article className="panel asset-chart-card" key={item.symbol}>
            <div className="asset-chart-heading">
              <div><strong>{item.symbol}</strong><span>{formatMoney(item.price)}</span></div>
              <b className={item.change_percent >= 0 ? 'positive' : 'negative'}>{formatPercent(item.change_percent)}</b>
            </div>
            <MarketChart points={item.points} previousClose={item.previous_close} range="1d" />
          </article>
        ))}
      </section>
    </div>
  )
}

function MarketStatusPage({ overview }) {
  const market = overview.market
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="page-title-icon"><Icon name="status" size={22} /></div>
        <div><h2>Market Status</h2><p>Provider, session and refresh status for the private monitor.</p></div>
      </div>
      <section className="status-detail-grid">
        <StatusDetail label="Current state" value={market.is_open ? 'Market open' : 'Market closed'} helper={market.session_label} tone={market.is_open ? 'positive' : ''} />
        <StatusDetail label="Provider feed" value={String(overview.feed).toUpperCase()} helper="Alpaca market data" />
        <StatusDetail label="Refresh cadence" value={`${overview.refresh_seconds} seconds`} helper="Shared API cache" />
        <StatusDetail label="Snapshot generated" value={formatTime(overview.generated_at)} helper={formatDate(overview.generated_at)} />
        <StatusDetail label="Next market open" value={formatTime(market.next_open, { withZone: true })} helper={formatDate(market.next_open)} />
        <StatusDetail label="Next market close" value={formatTime(market.next_close, { withZone: true })} helper={formatDate(market.next_close)} />
      </section>
      <section className="panel status-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">ASSET STATUS</span><h2>Latest market values</h2></div></div>
        <div className="table-scroll">
          <table className="market-table">
            <thead><tr><th>Asset</th><th>Price</th><th>Change</th><th>Open</th><th>High</th><th>Low</th><th>Volume</th><th>Updated</th></tr></thead>
            <tbody>
              {(overview.items || []).map((item) => (
                <tr key={item.symbol}>
                  <td><strong>{item.symbol}</strong></td>
                  <td>{formatMoney(item.price)}</td>
                  <td className={item.change_percent >= 0 ? 'positive' : 'negative'}>{formatPercent(item.change_percent)}</td>
                  <td>{formatMoney(item.open)}</td>
                  <td>{formatMoney(item.high)}</td>
                  <td>{formatMoney(item.low)}</td>
                  <td>{formatCompact(item.volume)}</td>
                  <td>{formatTime(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function QuoteValue({ label, value, tone = '' }) {
  return <div><span>{label}</span><strong className={tone}>{value}</strong></div>
}

function StatusDetail({ label, value, helper, tone = '' }) {
  return <article className="status-detail"><span>{label}</span><strong className={tone}>{value}</strong><small>{helper}</small></article>
}

function LoadingPanel() {
  return <div className="app-loading inline"><span className="loading-ring" />Loading private market data…</div>
}

function percentageOf(value, total) {
  if (!total) return '0%'
  return `${Math.round((Number(value) / Number(total)) * 100)}%`
}
