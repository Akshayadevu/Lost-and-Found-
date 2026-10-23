import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  async function signOut() { await logout(); navigate('/') }
  return (
    <div className="app-shell">
      <header className="navbar">
        <Link className="brand" to="/"><span>◈</span> FindBack</Link>
        <nav>
          <NavLink to="/browse">Browse</NavLink>
          {user && <NavLink to="/report/lost">Report</NavLink>}
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="nav-account">
          {user ? <><span className="user-name">Hi, {user.name.split(' ')[0]}</span><button className="button button-quiet" onClick={signOut}>Log out</button></> : <><Link to="/login">Log in</Link><Link className="button button-small" to="/register">Join FindBack</Link></>}
        </div>
      </header>
      {children}
      <footer><strong>FindBack</strong><span>Lost and found, made simpler for everyone.</span></footer>
    </div>
  )
}
