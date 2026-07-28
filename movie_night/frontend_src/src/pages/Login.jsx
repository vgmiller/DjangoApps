import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { joinGroup } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const S = {
  page: { minHeight: '100dvh', background: '#0D0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Outfit', sans-serif" },
  wrap: { width: '100%', maxWidth: '400px' },
  logo: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '52px', marginBottom: '12px' },
  title: { fontFamily: "'Fraunces', Georgia, serif", fontSize: '34px', fontWeight: 700, color: '#F5F5F0', margin: '0 0 6px', letterSpacing: '-0.5px' },
  subtitle: { color: '#9B9BAB', margin: 0, fontSize: '15px' },
  card: { background: '#16161D', border: '1px solid #2A2A35', borderRadius: '20px', padding: '32px' },
  error: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' },
  label: { display: 'block', color: '#9B9BAB', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.7px' },
  field: { marginBottom: '16px' },
  input: { width: '100%', background: '#0D0D12', border: '1px solid #2A2A35', borderRadius: '10px', padding: '12px 14px', color: '#F5F5F0', fontSize: '15px', fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' },
  btn: { width: '100%', background: '#E8A930', color: '#0D0D12', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'opacity 0.15s', marginTop: '8px' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#9B9BAB', fontSize: '14px' },
  link: { color: '#E8A930', textDecoration: 'none', fontWeight: 600 },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiLogin({ email, password, invite_code: inviteCode || undefined })
      await signIn()
      if (inviteCode) {
        const group = await joinGroup(inviteCode)
        navigate(`/groups/${group.id}`)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🎬</div>
          <h1 style={S.title}>Movie Night</h1>
          <p style={S.subtitle}>Sign in to your group</p>
        </div>
        <div style={S.card}>
          {error && <div style={S.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={S.input}
                onFocus={e => e.target.style.borderColor='#E8A930'}
                onBlur={e => e.target.style.borderColor='#2A2A35'} />
            </div>
            <div style={{ ...S.field, marginBottom: '24px' }}>
              <label style={S.label}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={S.input}
                onFocus={e => e.target.style.borderColor='#E8A930'}
                onBlur={e => e.target.style.borderColor='#2A2A35'} />
            </div>
            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
        <p style={S.footer}>
          No account yet?{' '}
          <Link to={inviteCode ? `/register?invite=${inviteCode}` : '/register'} style={S.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
