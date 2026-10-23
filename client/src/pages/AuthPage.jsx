import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'; const { login, register } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }) }
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { const data = isRegister ? await register(form) : await login(form); navigate(data.user.role === 'ADMIN' ? '/admin' : (location.state?.from || '/dashboard')) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <main className="auth-layout"><section className="auth-copy"><p className="eyebrow">FINDBACK ACCOUNT</p><h1>{isRegister ? 'Help good things find their way back.' : 'Welcome back.'}</h1><p>Use your account to submit reports, track claims, and communicate safely about handovers.</p></section><section className="auth-card"><h2>{isRegister ? 'Create your account' : 'Log in'}</h2>{error && <p className="alert error">{error}</p>}<form onSubmit={submit}>{isRegister && <label>Name<input name="name" value={form.name} onChange={update} required placeholder="Your name" /></label>}<label>Email<input type="email" name="email" value={form.email} onChange={update} required placeholder="name@example.com" /></label><label>Password<input type="password" name="password" value={form.password} onChange={update} required minLength="8" placeholder="At least 8 characters" /></label><button className="button full-width" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button></form><p className="form-switch">{isRegister ? 'Already have an account?' : 'New to FindBack?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create one'}</Link></p></section></main>
}
