import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'
import { getErrorMessage } from '../api/client'

const S = {
  logo: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '52px', marginBottom: '12px' },
  title: { fontSize: '34px' },
  field: { marginBottom: '16px' },
  btn: { marginTop: '8px' },
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🎬</div>
          <h1 className="auth-title" style={S.title}>Forgot Password</h1>
          <p className="auth-subtitle">We'll email you a reset link</p>
        </div>
        <div className="auth-card">
          {sent ? (
            <p>If an account exists for that email, a reset link is on its way. Check your inbox.</p>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={S.field}>
                  <label className="form-label">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="form-input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={S.btn}>
                  {loading ? 'Sending…' : 'Send Reset Link →'}
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
