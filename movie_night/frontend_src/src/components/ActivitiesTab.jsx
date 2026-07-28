import { useState, useEffect, useRef } from 'react'
import { listActivities, createActivity } from '../api/activities'
import ActivityCard from './ActivityCard'

const inputStyle = { width: '100%', background: '#0D0D12', border: '1px solid #2A2A35', borderRadius: '10px', padding: '11px 14px', color: '#F5F5F0', fontSize: '14px', fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' }
const focus = e => e.target.style.borderColor = '#E8A930'
const blur  = e => e.target.style.borderColor = '#2A2A35'

function AddForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: '', type: 'movie', imdb_url: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.imdb_url) delete payload.imdb_url
      if (!payload.description) delete payload.description
      const a = await onAdd(payload)
      onClose()
    } catch { setError('Failed to add activity.') }
    finally { setSaving(false) }
  }

  const labelStyle = { display: 'block', color: '#9B9BAB', fontSize: '11px', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }
  const field = { marginBottom: '12px' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={field}>
        <label style={labelStyle}>Title *</label>
        <input ref={firstRef} value={form.title} onChange={set('title')} required placeholder="e.g. Dune: Part Two" style={inputStyle} onFocus={focus} onBlur={blur} />
      </div>
      <div style={field}>
        <label style={labelStyle}>Type</label>
        <select value={form.type} onChange={set('type')} style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239B9BAB'%3E%3Cpath d='M7 10l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '32px', cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
          <option value="movie">🎬 Movie</option>
          <option value="tv">📺 TV Show</option>
          <option value="other">🎲 Other</option>
        </select>
      </div>
      <div style={field}>
        <label style={labelStyle}>IMDB URL <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
        <input type="url" value={form.imdb_url} onChange={set('imdb_url')} placeholder="https://imdb.com/title/..." style={inputStyle} onFocus={focus} onBlur={blur} />
      </div>
      <div style={{ ...field, marginBottom: '16px' }}>
        <label style={labelStyle}>Note <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
        <textarea value={form.description} onChange={set('description')} placeholder="Why should we watch this?" rows={2}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} onFocus={focus} onBlur={blur} />
      </div>
      {error && <p style={{ color: '#FCA5A5', fontSize: '13px', margin: '-8px 0 12px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={onClose} style={{ flex: 1, background: '#1E1E28', border: '1px solid #2A2A35', color: '#9B9BAB', borderRadius: '10px', padding: '11px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ flex: 2, background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Adding…' : 'Add Activity'}
        </button>
      </div>
    </form>
  )
}

export default function ActivitiesTab({ groupId, onSchedule }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)

  useEffect(() => {
    listActivities(groupId).then(setActivities).finally(() => setLoading(false))
  }, [groupId])

  const handleAdd = async (payload) => {
    const a = await createActivity(groupId, payload)
    setActivities(prev => [a, ...prev])
    return a
  }

  const handleSchedule = (activity) => {
    setSelectedActivity(activity)
    onSchedule(activity)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      {/* Add form (inline on desktop, slide-up on mobile) */}
      {showForm && (
        <div style={{ background: '#1E1E28', border: '1px solid #2A2A35', borderRadius: '14px', padding: '16px', marginBottom: '16px' }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F5F5F0' }}>Add an Activity</h3>
          </div>
          <AddForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Header row */}
      {!showForm && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#9B9BAB' }}>
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </h2>
          <button onClick={() => setShowForm(true)} style={{
            background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px',
            padding: '9px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            + Add
          </button>
        </div>
      )}

      {/* List */}
      {activities.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed #2A2A35', borderRadius: '16px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍿</div>
          <h3 className="display" style={{ margin: '0 0 6px', color: '#F5F5F0', fontSize: '18px' }}>No activities yet</h3>
          <p style={{ color: '#9B9BAB', fontSize: '14px', margin: '0 0 16px' }}>Add the first one to get started!</p>
          <button onClick={() => setShowForm(true)} style={{ background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
            Add Activity
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map(a => (
            <ActivityCard key={a.id} activity={a} onSchedule={() => handleSchedule(a)} />
          ))}
        </div>
      )}
    </div>
  )
}
