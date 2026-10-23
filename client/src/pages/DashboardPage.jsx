import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../services/api'

export default function DashboardPage() {
  const [data, setData] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api('/dashboard').then(setData).catch(err => setError(err.message)) }, [])
  if (error) return <main className="page"><p className="alert error">{error}</p></main>; if (!data) return <main className="page loading">Loading your dashboard…</main>
  const count = data.counts
  return <main className="page"><div className="page-heading split-heading"><div><p className="eyebrow">YOUR SPACE</p><h1>My dashboard</h1><p>Track reports, claims, and important updates in one place.</p></div><Link className="button" to="/report/lost">New report</Link></div><section className="stat-grid"><div><b>{count.lost_reports || 0}</b><span>Lost reports</span></div><div><b>{count.found_reports || 0}</b><span>Found reports</span></div><div><b>{count.claims || 0}</b><span>Submitted claims</span></div><div><b>{count.unreadMessages || 0}</b><span>Unread messages</span></div></section><section className="two-column"><div className="panel"><h2>Recent status updates</h2>{data.recentUpdates.length ? data.recentUpdates.map(update => <div className="timeline-row" key={update.id}><span className="timeline-dot" /><div><strong>{update.title}</strong><p><StatusBadge status={update.new_status} /> {update.reason || 'Status updated'}</p></div></div>) : <p className="muted">No updates yet.</p>}</div><div className="panel action-panel"><h2>Quick actions</h2><Link to="/my-reports">Manage my reports →</Link><Link to="/my-claims">View my claims →</Link><Link to="/browse">Browse public reports →</Link></div></section></main>
}
