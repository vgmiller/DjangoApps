import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { register as apiRegister } from '../api/auth'
import { previewInvite } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/useAuth'

const S = {
  logo: { textAlign: 'center', marginBottom: '36px' },
  title: { fontSize: '34px' },
  field: { marginBottom: '16px' },
  hint: { color: 'var(--muted)', fontSize: '12px', marginTop: '5px' },
}

function Field({ label, hint, children }) {
  return (
    <div style={S.field}>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p style={S.hint}>{hint}</p>}
    </div>
  )
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone_number: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const inputProps = (k, type = 'text', placeholder = '') => ({
    type, value: form[k], onChange: set(k), placeholder, className: 'form-input',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.phone_number) delete payload.phone_number
      if (inviteCode) payload.invite_code = inviteCode
      await apiRegister(payload)
      await signIn()
      if (inviteCode) {
        // Register already joined the group server-side (invite_code above)
        // -- this is just a read to get the group id for the redirect.
        const group = await previewInvite(inviteCode)
        navigate(`/groups/${group.id}`)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={S.logo}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎬</div>
          <h1 className="auth-title" style={S.title}>Join Movie Night</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>
        <div className="auth-card">
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <input {...inputProps('name', 'text', 'Your name')} required />
            </Field>
            <Field label="Email">
              <input {...inputProps('email', 'email', 'you@example.com')} required />
            </Field>
            <Field label="Password">
              <input {...inputProps('password', 'password', '8+ characters')} required minLength={8} />
            </Field>
            <Field label="Phone Number" hint="Optional — for future SMS notifications">
              <input {...inputProps('phone_number', 'tel', '+1 (555) 000-0000')} />
            </Field>
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '16px' }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        </div>
        <p className="auth-footer">
          Already have an account?{' '}
          <Link to={inviteCode ? `/login?invite=${inviteCode}` : '/login'} className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
