import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { previewInvite, joinGroup } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/useAuth'

const S = {
  wrap: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  logoIcon: { fontSize: '48px', marginBottom: '12px' },
  title: { fontSize: '26px', margin: '0 0 8px', letterSpacing: '-0.4px' },
  subtitle: { margin: '0 0 24px' },
  btnSecondary: { marginTop: '10px' },
}

export default function JoinGroup() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [group, setGroup] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    previewInvite(code)
      .then(setGroup)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [code])

  const handleJoin = async () => {
    setJoining(true)
    setError('')
    try {
      const g = await joinGroup(code)
      navigate(`/groups/${g.id}`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not join that group.'))
      setJoining(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="auth-page">
        <div className="spinner" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="auth-page">
        <div style={S.wrap}>
          <div style={S.logoIcon}>🎬</div>
          <div className="auth-card">
            <h1 className="auth-title" style={S.title}>Invite not found</h1>
            <p className="auth-subtitle" style={S.subtitle}>This invite link is invalid or has expired.</p>
            <Link to="/" className="auth-link">Back to Movie Night</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div style={S.wrap}>
        <div style={S.logoIcon}>🎬</div>
        <div className="auth-card">
          <h1 className="auth-title" style={S.title}>You're invited to</h1>
          <p className="auth-subtitle" style={{ ...S.subtitle, color: 'var(--text)', fontSize: '20px', fontWeight: 700 }}>{group.name}</p>
          {error && <div className="form-error">{error}</div>}
          {user ? (
            <button onClick={handleJoin} disabled={joining} className="btn-primary">
              {joining ? 'Joining…' : 'Join Group →'}
            </button>
          ) : (
            <>
              <Link to={`/register?invite=${code}`} className="btn-primary" style={{ display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>
                Create Account & Join
              </Link>
              <Link to={`/login?invite=${code}`} className="btn-secondary" style={{ ...S.btnSecondary, display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>
                Sign In & Join
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
