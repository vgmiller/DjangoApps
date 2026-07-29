import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { previewInvite } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/useAuth'

const S = {
  logo: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '52px', marginBottom: '12px' },
  title: { fontSize: '34px' },
  field: { marginBottom: '16px' },
  btn: { marginTop: '8px' },
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
        // Login already joined the group server-side (invite_code above) --
        // this is just a read to get the group id for the redirect.
        const group = await previewInvite(inviteCode)
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
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🎬</div>
          <h1 className="auth-title" style={S.title}>Movie Night</h1>
          <p className="auth-subtitle">Sign in to your group</p>
        </div>
        <div className="auth-card">
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="form-input" />
            </div>
            <div style={{ ...S.field, marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="form-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={S.btn}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <p className="auth-footer" style={{ marginTop: '16px' }}>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </p>
        </div>
        <p className="auth-footer">
          No account yet?{' '}
          <Link to={inviteCode ? `/register?invite=${inviteCode}` : '/register'} className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  )
}
