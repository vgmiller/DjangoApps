import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Layout({ children, groupName }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const isGroupPage = location.pathname.startsWith('/groups/')

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,13,18,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🎬</span>
          <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.2px' }}>
            {groupName
              ? <span style={{ color: 'var(--muted)', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: '14px' }}>{groupName}</span>
              : <span className="display" style={{ fontSize: '18px', fontWeight: 700 }}>Movie Night</span>
            }
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          {user && (
            <>
              <span style={{ color: 'var(--muted)', fontSize: '13px', whiteSpace: 'nowrap' }}
                className="show-sm-up">
                {user.name}
              </span>
              <button onClick={handleSignOut} className="hover-amber-border-text" style={{
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--muted)', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}>
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, paddingBottom: isGroupPage ? '0' : '0' }}>
        {children}
      </main>
    </div>
  )
}
