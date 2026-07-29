import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api/auth'
import { getErrorMessage } from '../api/client'

const S = {
  logo: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '52px', marginBottom: '12px' },
  title: { fontSize: '34px' },
  field: { marginBottom: '16px' },
  btn: { marginTop: '8px' },
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset({ uid, token, password })
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err, 'That reset link is invalid or has expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🎬</div>
          <h1 className="auth-title" style={S.title}>Reset Password</h1>
          <p className="auth-subtitle">Choose a new password</p>
        </div>
        <div className="auth-card">
          {!uid || !token ? (
            <div className="form-error">This reset link is missing required information.</div>
          ) : done ? (
            <>
              <p>Your password has been reset.</p>
              <button type="button" className="btn-primary" style={S.btn} onClick={() => navigate('/login')}>
                Sign In →
              </button>
            </>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ ...S.field, marginBottom: '24px' }}>
                  <label className="form-label">New Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="8+ characters" className="form-input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={S.btn}>
                  {loading ? 'Resetting…' : 'Reset Password →'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="auth-footer">
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
