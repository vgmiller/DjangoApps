import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { joinGroup } from '../api/groups'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const S = {
  page: { minHeight: '100dvh', background: '#0D0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Outfit', sans-serif" },
  wrap: { width: '100%', maxWidth: '420px' },
  logo: { textAlign: 'center', marginBottom: '36px' },
  title: { fontFamily: "'Fraunces', Georgia, serif", fontSize: '34px', fontWeight: 700, color: '#F5F5F0', margin: '0 0 6px', letterSpacing: '-0.5px' },
  subtitle: { color: '#9B9BAB', margin: 0, fontSize: '15px' },
  card: { background: '#16161D', border: '1px solid #2A2A35', borderRadius: '20px', padding: '32px' },
  error: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' },
  label: { display: 'block', color: '#9B9BAB', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.7px' },
  field: { marginBottom: '16px' },
  input: { width: '100%', background: '#0D0D12', border: '1px solid #2A2A35', borderRadius: '10px', padding: '12px 14px', color: '#F5F5F0', fontSize: '15px', fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' },
  hint: { color: '#9B9BAB', fontSize: '12px', marginTop: '5px' },
  btn: { width: '100%', background: '#E8A930', color: '#0D0D12', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: '8px', transition: 'opacity 0.15s' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#9B9BAB', fontSize: '14px' },
  link: { color: '#E8A930', textDecoration: 'none', fontWeight: 600 },
}

function Field({ label, hint, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
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
    type, value: form[k], onChange: set(k), placeholder, style: S.input,
    onFocus: e => e.target.style.borderColor = '#E8A930',
    onBlur: e => e.target.style.borderColor = '#2A2A35',
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
        const group = await joinGroup(inviteCode)
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
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logo}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎬</div>
          <h1 style={S.title}>Join Movie Night</h1>
          <p style={S.subtitle}>Create your account</p>
        </div>
        <div style={S.card}>
          {error && <div style={S.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <input {...inputProps('name', 'text', 'Your name')} required />
            </Field>
            <Field label="Email">
              <input {...inputProps('email', 'email', 'you@example.com')} required />
            </Field>
            <Field label="Password">
              <input {...inputProps('password', 'password', '8+ characters')} required minLength={6} />
            </Field>
            <Field label="Phone Number" hint="Optional — for future SMS notifications">
              <input {...inputProps('phone_number', 'tel', '+1 (555) 000-0000')} />
            </Field>
            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1, marginTop: '16px' }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        </div>
        <p style={S.footer}>
          Already have an account?{' '}
          <Link to={inviteCode ? `/login?invite=${inviteCode}` : '/login'} style={S.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
