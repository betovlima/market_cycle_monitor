import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatChartTime, formatCompact, formatMoney } from './formatters'

function ChartTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null
  const price = payload.find((entry) => entry.dataKey === 'price')?.value
  const volume = payload.find((entry) => entry.dataKey === 'volume')?.value
  return (
    <div className="chart-tooltip">
      <strong>{formatChartTime(label, range)}</strong>
      <span>Price {formatMoney(price)}</span>
      {volume ? <span>Volume {formatCompact(volume)}</span> : null}
    </div>
  )
}

export function MarketChart({ points, previousClose, range = '1d', compact = false, trendPositive = true }) {
  const sourcePoints = points || []
  const maximumPoints = compact ? 90 : 900
  const stride = Math.max(1, Math.ceil(sourcePoints.length / maximumPoints))
  const sampledPoints = sourcePoints.filter((_, index) => index % stride === 0 || index === sourcePoints.length - 1)
  const data = sampledPoints.map((point) => ({
    timestamp: point.timestamp,
    price: Number(point.price),
    volume: Number(point.volume || 0),
  }))

  if (!data.length) {
    return <div className={`chart-empty ${compact ? 'compact' : ''}`}>No market points available.</div>
  }

  return (
    <div className={compact ? 'mini-chart-canvas' : 'market-chart-canvas'}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={compact ? { top: 4, right: 2, bottom: 0, left: 2 } : { top: 12, right: 18, bottom: 8, left: 6 }}>
          {!compact ? <CartesianGrid stroke="rgba(132, 160, 194, .14)" strokeDasharray="3 3" vertical={false} /> : null}
          <XAxis
            dataKey="timestamp"
            hide={compact}
            tickFormatter={(value) => formatChartTime(value, range)}
            minTickGap={34}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7f93ad', fontSize: 11 }}
          />
          <YAxis
            yAxisId="price"
            hide={compact}
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            width={64}
            tick={{ fill: '#7f93ad', fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(2)}
          />
          <YAxis yAxisId="volume" orientation="right" hide domain={[0, 'dataMax']} />
          {!compact ? <Tooltip content={<ChartTooltip range={range} />} /> : null}
          {!compact && previousClose != null ? (
            <ReferenceLine
              yAxisId="price"
              y={Number(previousClose)}
              stroke="rgba(191, 205, 224, .55)"
              strokeDasharray="4 4"
              label={{ value: 'Prev close', position: 'insideTopRight', fill: '#8fa2ba', fontSize: 10 }}
            />
          ) : null}
          {!compact ? (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="rgba(67, 124, 208, .22)"
              maxBarSize={6}
              isAnimationActive={false}
            />
          ) : null}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke={compact ? (trendPositive ? '#35c98f' : '#ef6b73') : '#3f93ff'}
            strokeWidth={compact ? 1.6 : 2}
            fill={compact ? (trendPositive ? 'rgba(53, 201, 143, .08)' : 'rgba(239, 107, 115, .08)') : 'rgba(47, 140, 255, .14)'}
            dot={false}
            activeDot={compact ? false : { r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
