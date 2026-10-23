import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { imageUrl } from '../services/api'

export default function ItemCard({ item }) {
  return (
    <article className="item-card">
      <div className="item-image">{imageUrl(item.image_filename) ? <img src={imageUrl(item.image_filename)} alt={item.title} /> : <span>⌕</span>}</div>
      <div className="item-card-body">
        <div className="card-topline"><span className={`type type-${item.report_type?.toLowerCase()}`}>{item.report_type}</span><StatusBadge status={item.status} /></div>
        <h3>{item.title}</h3>
        <p className="card-description">{item.description}</p>
        <p className="meta">{item.category} · {item.location}</p>
        <Link className="text-link" to={`/items/${item.id}`}>View report →</Link>
      </div>
    </article>
  )
}
