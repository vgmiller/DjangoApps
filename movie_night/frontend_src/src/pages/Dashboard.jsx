import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGroups, createGroup, joinGroup, buildInviteLink } from '../api/groups'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay modal-overlay-bottom" onClick={onClose}>
      <div className="slide-up modal-sheet" onClick={e => e.stopPropagation()}>
        {/* drag handle */}
        <div className="modal-drag-handle" />
        <h2 className="display" style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// On md+, center modal
function DesktopModal({ title, onClose, children }) {
  return (
    <div className="modal-overlay modal-overlay-center" onClick={onClose}>
      <div className="fade-in auth-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px' }}>
        <h2 className="display" style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

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
    <div onClick={onClick} className="card-hover" style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
      padding: '20px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎭</div>
          <h3 className="display" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>{group.name}</h3>
        </div>
        <div style={{ fontSize: '20px', opacity: 0.5 }}>→</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</span>
          <code className="invite-code-badge" style={{ fontSize: '13px', padding: '2px 8px', letterSpacing: '1px' }}>{group.invite_code}</code>
        </div>
        <button onClick={copyCode} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: "'Outfit', sans-serif", transition: 'color 0.15s' }}>
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>
      <button onClick={copyLink} className={`copy-link-btn${linkCopied ? ' copied' : ''}`} style={{ width: '100%', fontSize: '13px', fontWeight: 600, padding: '8px', borderRadius: '8px' }}>
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
            <h1 className="display" style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '15px' }}>Your movie groups</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setModal('join')} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500, whiteSpace: 'nowrap' }}>
              Join
            </button>
            <button onClick={() => setModal('create')} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>
              + New Group
            </button>
          </div>
        </div>

        {/* Groups grid */}
        {loading ? (
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1,2].map(i => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', height: '110px', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
            <h3 className="display" style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '20px', fontWeight: 700 }}>No groups yet</h3>
            <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: '14px' }}>Create a group or join one with an invite code</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setModal('create')} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                Create a group
              </button>
              <button onClick={() => setModal('join')} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>
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
            <label className="form-label">Group name</label>
            <input autoFocus value={formVal} onChange={e => setFormVal(e.target.value)} placeholder="e.g. The Watch Party Crew" className="form-input" required />
            {error && <p style={{ color: 'var(--danger-text)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '12px' }}>
              {submitting ? 'Creating…' : 'Create Group'}
            </button>
          </form>
        </ModalComp>
      )}
      {modal === 'join' && (
        <ModalComp title="Join a group" onClose={closeModal}>
          <form onSubmit={handleJoin}>
            <label className="form-label">Invite code</label>
            <input autoFocus value={formVal} onChange={e => setFormVal(e.target.value)} placeholder="e.g. WXYZ1234" className="form-input" style={{ letterSpacing: '2px', textTransform: 'uppercase' }} required />
            {error && <p style={{ color: 'var(--danger-text)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '12px' }}>
              {submitting ? 'Joining…' : 'Join Group'}
            </button>
          </form>
        </ModalComp>
      )}
    </Layout>
  )
}
