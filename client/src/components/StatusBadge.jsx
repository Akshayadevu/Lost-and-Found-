export default function StatusBadge({ status }) {
  const label = status?.replaceAll('_', ' ') || 'UNKNOWN'
  return <span className={`status status-${status?.toLowerCase()}`}>{label}</span>
}
