import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { previewInvite, joinGroup } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const S = {
  page: { minHeight: '100dvh', background: '#0D0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Outfit', sans-serif" },
  wrap: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  logoIcon: { fontSize: '48px', marginBottom: '12px' },
  card: { background: '#16161D', border: '1px solid #2A2A35', borderRadius: '20px', padding: '32px' },
  title: { fontFamily: "'Fraunces', Georgia, serif", fontSize: '26px', fontWeight: 700, color: '#F5F5F0', margin: '0 0 8px', letterSpacing: '-0.4px' },
  subtitle: { color: '#9B9BAB', margin: '0 0 24px', fontSize: '15px' },
  error: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' },
  btn: { width: '100%', background: '#E8A930', color: '#0D0D12', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'opacity 0.15s' },
  btnSecondary: { width: '100%', background: '#1E1E28', border: '1px solid #2A2A35', color: '#F5F5F0', borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: '10px' },
  link: { color: '#E8A930', textDecoration: 'none', fontWeight: 600 },
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
      <div style={S.page}>
        <div className="spinner" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <div style={S.logoIcon}>🎬</div>
          <div style={S.card}>
            <h1 style={S.title}>Invite not found</h1>
            <p style={S.subtitle}>This invite link is invalid or has expired.</p>
            <Link to="/" style={S.link}>Back to Movie Night</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logoIcon}>🎬</div>
        <div style={S.card}>
          <h1 style={S.title}>You're invited to</h1>
          <p style={{ ...S.subtitle, color: '#F5F5F0', fontSize: '20px', fontWeight: 700 }}>{group.name}</p>
          {error && <div style={S.error}>{error}</div>}
          {user ? (
            <button onClick={handleJoin} disabled={joining} style={{ ...S.btn, opacity: joining ? 0.6 : 1 }}>
              {joining ? 'Joining…' : 'Join Group →'}
            </button>
          ) : (
            <>
              <Link to={`/register?invite=${code}`} style={{ ...S.btn, display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>
                Create Account & Join
              </Link>
              <Link to={`/login?invite=${code}`} style={{ ...S.btnSecondary, display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>
                Sign In & Join
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
