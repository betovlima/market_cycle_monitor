export function formatMoney(value, options = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const { maximumFractionDigits = 2 } = options
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(Number(value))
}

export function formatNumber(value, options = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', options).format(Number(value))
}

export function formatPercent(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const number = Number(value)
  const prefix = number > 0 ? '+' : ''
  return `${prefix}${number.toFixed(digits)}%`
}

export function formatCompact(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatClockDuration(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return '—'
  const safe = Math.max(0, Math.floor(Number(seconds)))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remainingSeconds = safe % 60
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export function formatTime(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: options.withSeconds === false ? undefined : '2-digit',
    hour12: true,
    timeZoneName: options.withZone ? 'short' : undefined,
  }).format(date)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatChartTime(value, range = '1d') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (range === '1d' || range === '5d') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}
