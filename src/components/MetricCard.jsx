import { Icon } from './Icon'

export function MetricCard({ icon, label, value, helper, tone = 'blue' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon name={icon} size={24} /></div>
      <div>
        <span>{label}</span>
        <strong className={tone === 'red' ? 'negative' : tone === 'green' ? 'positive' : ''}>{value}</strong>
        {helper ? <small>{helper}</small> : null}
      </div>
    </article>
  )
}
