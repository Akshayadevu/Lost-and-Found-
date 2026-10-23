import { useEffect, useState } from 'react'
import ItemCard from '../components/ItemCard'
import { api } from '../services/api'

const initialFilters = { search: '', type: '', category: '', location: '', date: '' }
export default function BrowsePage() {
  const [filters, setFilters] = useState(initialFilters); const [items, setItems] = useState([]); const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { api('/items/categories').then(data => setCategories(data.categories)) }, [])
  useEffect(() => { const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)); setLoading(true); api(`/items?${params}`).then(data => { setItems(data.items); setError('') }).catch(err => setError(err.message)).finally(() => setLoading(false)) }, [filters])
  function change(event) { setFilters({ ...filters, [event.target.name]: event.target.value }) }
  return <main className="page"><div className="page-heading"><p className="eyebrow">PUBLIC LISTINGS</p><h1>Find what you’re looking for.</h1><p>Browse only the details needed to identify an item safely.</p></div><section className="filter-panel"><input className="search-input" name="search" value={filters.search} onChange={change} placeholder="Search title or description" /><select name="type" value={filters.type} onChange={change}><option value="">Lost & found</option><option value="LOST">Lost</option><option value="FOUND">Found</option></select><select name="category" value={filters.category} onChange={change}><option value="">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select><input name="location" value={filters.location} onChange={change} placeholder="City, area, or landmark" /><input type="date" name="date" value={filters.date} onChange={change} /><button className="button button-quiet" onClick={() => setFilters(initialFilters)}>Clear</button></section>{error && <p className="alert error">{error}</p>}{loading ? <p className="loading">Loading reports…</p> : items.length ? <div className="item-grid">{items.map(item => <ItemCard key={item.id} item={item} />)}</div> : <div className="empty-state"><h3>No matching reports</h3><p>Try clearing a filter or changing your search.</p></div>}</main>
}
