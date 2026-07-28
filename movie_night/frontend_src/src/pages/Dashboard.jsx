import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGroups, createGroup, joinGroup, buildInviteLink } from '../api/groups'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0',
    }} onClick={onClose}>
      <div className="slide-up" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '480px',
        background: '#16161D', borderRadius: '20px 20px 0 0',
        border: '1px solid #2A2A35', borderBottom: 'none',
        padding: '28px 24px 40px',
      }}>
        {/* drag handle */}
        <div style={{ width: '40px', height: '4px', background: '#2A2A35', borderRadius: '2px', margin: '0 auto 20px' }} />
        <h2 className="display" style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.3px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// On md+, center modal
function DesktopModal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div className="fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', background: '#16161D', borderRadius: '20px', border: '1px solid #2A2A35', padding: '32px' }}>
        <h2 className="display" style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.3px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', background: '#0D0D12', border: '1px solid #2A2A35', borderRadius: '10px', padding: '12px 14px', color: '#F5F5F0', fontSize: '15px', fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' }
const btnPrimary = { width: '100%', background: '#E8A930', color: '#0D0D12', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: '12px' }

function GroupCard({ group, onClick }) {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyCode = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(buildInviteLink(group.invite_code))
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div onClick={onClick} style={{
      background: '#16161D', border: '1px solid #2A2A35', borderRadius: '16px',
      padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#E8A930'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#2A2A35'; e.currentTarget.style.transform='translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎭</div>
          <h3 className="display" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.2px' }}>{group.name}</h3>
        </div>
        <div style={{ fontSize: '20px', opacity: 0.5 }}>→</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#9B9BAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</span>
          <code style={{ fontSize: '13px', color: '#E8A930', background: 'rgba(232,169,48,0.1)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', letterSpacing: '1px' }}>{group.invite_code}</code>
        </div>
        <button onClick={copyCode} style={{ background: 'transparent', border: 'none', color: '#9B9BAB', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", transition: 'color 0.15s' }}>
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>
      <button onClick={copyLink} style={{ width: '100%', background: linkCopied ? 'rgba(232,169,48,0.15)' : '#1E1E28', border: '1px solid #2A2A35', color: linkCopied ? '#E8A930' : '#9B9BAB', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px', borderRadius: '8px', fontFamily: "'Outfit', sans-serif", transition: 'background 0.15s, color 0.15s' }}>
        {linkCopied ? '✓ Invite link copied' : '🔗 Copy invite link'}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'join'
  const [formVal, setFormVal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640)
  const ModalComp = isDesktop ? DesktopModal : Modal

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    listGroups().then(setGroups).finally(() => setLoading(false))
  }, [])

  const closeModal = () => { setModal(null); setFormVal(''); setError('') }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formVal.trim()) return
    setSubmitting(true); setError('')
    try {
      const g = await createGroup({ name: formVal.trim() })
      setGroups(prev => [g, ...prev])
      closeModal()
      navigate(`/groups/${g.id}`)
    } catch { setError('Failed to create group.') }
    finally { setSubmitting(false) }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!formVal.trim()) return
    setSubmitting(true); setError('')
    try {
      const g = await joinGroup(formVal.trim().toUpperCase())
      setGroups(prev => prev.find(x => x.id === g.id) ? prev : [g, ...prev])
      closeModal()
      navigate(`/groups/${g.id}`)
    } catch { setError('Invalid invite code. Check and try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <Layout>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px' }}>
          <div>
            <h1 className="display" style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.5px' }}>
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ margin: 0, color: '#9B9BAB', fontSize: '15px' }}>Your movie groups</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setModal('join')} style={{ background: '#1E1E28', border: '1px solid #2A2A35', color: '#F5F5F0', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500, whiteSpace: 'nowrap' }}>
              Join
            </button>
            <button onClick={() => setModal('create')} style={{ background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>
              + New Group
            </button>
          </div>
        </div>

        {/* Groups grid */}
        {loading ? (
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1,2].map(i => (
              <div key={i} style={{ background: '#16161D', border: '1px solid #2A2A35', borderRadius: '16px', height: '110px', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #2A2A35', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
            <h3 className="display" style={{ margin: '0 0 8px', color: '#F5F5F0', fontSize: '20px', fontWeight: 700 }}>No groups yet</h3>
            <p style={{ color: '#9B9BAB', margin: '0 0 20px', fontSize: '14px' }}>Create a group or join one with an invite code</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setModal('create')} style={{ background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                Create a group
              </button>
              <button onClick={() => setModal('join')} style={{ background: '#1E1E28', border: '1px solid #2A2A35', color: '#F5F5F0', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {groups.map(g => (
              <GroupCard key={g.id} group={g} onClick={() => navigate(`/groups/${g.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <ModalComp title="Create a group" onClose={closeModal}>
          <form onSubmit={handleCreate}>
            <label style={{ display: 'block', color: '#9B9BAB', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Group name</label>
            <input autoFocus value={formVal} onChange={e => setFormVal(e.target.value)} placeholder="e.g. The Watch Party Crew" style={inputStyle}
              onFocus={e => e.target.style.borderColor='#E8A930'}
              onBlur={e => e.target.style.borderColor='#2A2A35'} required />
            {error && <p style={{ color: '#FCA5A5', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Creating…' : 'Create Group'}
            </button>
          </form>
        </ModalComp>
      )}
      {modal === 'join' && (
        <ModalComp title="Join a group" onClose={closeModal}>
          <form onSubmit={handleJoin}>
            <label style={{ display: 'block', color: '#9B9BAB', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Invite code</label>
            <input autoFocus value={formVal} onChange={e => setFormVal(e.target.value)} placeholder="e.g. WXYZ1234" style={{ ...inputStyle, letterSpacing: '2px', textTransform: 'uppercase' }}
              onFocus={e => e.target.style.borderColor='#E8A930'}
              onBlur={e => e.target.style.borderColor='#2A2A35'} required />
            {error && <p style={{ color: '#FCA5A5', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Joining…' : 'Join Group'}
            </button>
          </form>
        </ModalComp>
      )}
    </Layout>
  )
}
