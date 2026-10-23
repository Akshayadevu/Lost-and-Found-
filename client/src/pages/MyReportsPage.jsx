import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../services/api'

export default function MyReportsPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const location = useLocation()
  function load() { api('/items/mine/list').then(data => setItems(data.items)).catch(err => setError(err.message)) }
  useEffect(load, [])
  async function resolve(id) { if (!window.confirm('Mark this lost report as resolved?')) return; try { await api(`/items/${id}/resolve`, { method: 'PATCH' }); load() } catch (err) { setError(err.message) } }
  async function remove(id) { if (!window.confirm('Delete this report?')) return; try { await api(`/items/${id}`, { method: 'DELETE' }); load() } catch (err) { setError(err.message) } }
  return <main className="page"><div className="page-heading split-heading"><div><p className="eyebrow">YOUR REPORTS</p><h1>Reports you created</h1></div><Link className="button" to="/report/found">Report found item</Link></div>{location.state?.message && <p className="alert success">{location.state.message}</p>}{error && <p className="alert error">{error}</p>}<section className="table-panel"><table><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.category}</small></td><td>{item.report_type}</td><td><StatusBadge status={item.status} /></td><td>{new Date(item.created_at).toLocaleDateString()}</td><td className="table-actions">{item.report_type === 'LOST' && ['ACTIVE', 'CLAIM_PENDING'].includes(item.status) && <button onClick={() => resolve(item.id)}>Resolve</button>}{['PENDING_REVIEW','ACTIVE'].includes(item.status) && <button className="danger-text" onClick={() => remove(item.id)}>Delete</button>}</td></tr>)}</tbody></table>{!items.length && <div className="empty-state">You have not submitted any reports yet.</div>}</section></main>
}
