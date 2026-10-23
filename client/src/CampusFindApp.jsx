import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import BrowsePage from './pages/BrowsePage'
import ReportPage from './pages/ReportPage'
import DashboardPage from './pages/DashboardPage'
import MyReportsPage from './pages/MyReportsPage'
import MyClaimsPage from './pages/MyClaimsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import AdminPage from './pages/AdminPage'
import './styles/campusfind.css'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <main className="page loading">Loading CampusFind…</main>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return <Layout><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/browse" element={<BrowsePage />} />
    <Route path="/items/:id" element={<ItemDetailPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/report/lost" element={<ProtectedRoute><ReportPage type="LOST" /></ProtectedRoute>} />
    <Route path="/report/found" element={<ProtectedRoute><ReportPage type="FOUND" /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
    <Route path="/my-claims" element={<ProtectedRoute><MyClaimsPage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>
}

export default function CampusFindApp() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
