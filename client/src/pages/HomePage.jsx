import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ItemCard from '../components/ItemCard'
import { api } from '../services/api'

export default function HomePage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  useEffect(() => { api('/items').then(data => { setItems(data.items.slice(0, 3)); setTotal(data.pagination.total) }).catch(() => {}) }, [])
  return <main>
    <section className="hero-section">
      <div><p className="eyebrow">LOST & FOUND, CONNECTED</p><h1>Every lost item<br /><em>deserves a way home.</em></h1><p className="hero-copy">A respectful, secure place for anyone to report, discover, verify, and recover belongings.</p><div className="hero-actions"><Link className="button" to="/report/lost">Report lost item</Link><Link className="button button-secondary" to="/report/found">Report found item</Link></div></div>
      <aside className="hero-panel"><span className="hero-symbol">⌕</span><div><strong>{total}</strong><span>public reports available</span></div><p>Built for thoughtful returns, not public exposure.</p></aside>
    </section>
    <section className="how-section"><p className="eyebrow">HOW IT WORKS</p><h2>A clear path from lost to found.</h2><div className="steps"><div><b>01</b><h3>Report</h3><p>Share safe details about something you lost or found.</p></div><div><b>02</b><h3>Match</h3><p>Search listings and use private clues for verification.</p></div><div><b>03</b><h3>Recover</h3><p>Submit a claim and arrange a secure handover.</p></div></div></section>
    <section className="listing-section"><div className="section-heading"><div><p className="eyebrow">RECENT REPORTS</p><h2>On the board now</h2></div><Link className="text-link" to="/browse">Browse all reports →</Link></div>{items.length ? <div className="item-grid">{items.map(item => <ItemCard key={item.id} item={item} />)}</div> : <div className="empty-state">No active reports yet. Your first report can help someone.</div>}</section>
  </main>
}
