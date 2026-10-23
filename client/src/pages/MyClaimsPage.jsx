import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { api } from '../services/api'

export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]); const [error, setError] = useState('')
  useEffect(() => { api('/claims/mine').then(data => setClaims(data.claims)).catch(err => setError(err.message)) }, [])
  return <main className="page"><div className="page-heading"><p className="eyebrow">YOUR CLAIMS</p><h1>Ownership claims</h1><p>Administrators review your explanation and private proof before a return is recorded.</p></div>{error && <p className="alert error">{error}</p>}<section className="claim-list">{claims.map(claim => <article className="claim-card" key={claim.id}><div><h3>{claim.title}</h3><p>{claim.category}</p><small>Submitted {new Date(claim.created_at).toLocaleDateString()}</small></div><div><StatusBadge status={claim.status} />{claim.decision_reason && <p className="decision-note">{claim.decision_reason}</p>}</div></article>)}{!claims.length && <div className="empty-state">No claims yet. Browse found items to begin.</div>}</section></main>
}
