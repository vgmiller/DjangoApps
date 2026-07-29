import { useState, useEffect, useRef } from 'react'
import { listActivities, createActivity, updateActivity, deleteActivity } from '../api/activities'
import { fetchPage } from '../api/client'
import { useAuth } from '../context/useAuth'
import ActivityCard from './ActivityCard'

const inputStyle = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 14px', color: 'var(--text)', fontSize: '14px', fontFamily: "'Outfit', sans-serif" }
const inputClass = 'input-focus-amber'

function AddForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { title: '', type: 'movie', imdb_url: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)
  const isEdit = !!initial

  useEffect(() => { firstRef.current?.focus() }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.imdb_url) delete payload.imdb_url
      if (!payload.description) delete payload.description
      await onSave(payload)
      onClose()
    } catch { setError(isEdit ? 'Failed to save changes.' : 'Failed to add activity.') }
    finally { setSaving(false) }
  }

  const labelStyle = { display: 'block', color: 'var(--muted)', fontSize: '11px', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }
  const field = { marginBottom: '12px' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={field}>
        <label style={labelStyle}>Title *</label>
        <input ref={firstRef} value={form.title} onChange={set('title')} required placeholder="e.g. Dune: Part Two" className={inputClass} style={inputStyle} />
      </div>
      <div style={field}>
        <label style={labelStyle}>Type</label>
        <select value={form.type} onChange={set('type')} className={inputClass} style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239B9BAB'%3E%3Cpath d='M7 10l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '32px', cursor: 'pointer' }}>
          <option value="movie">🎬 Movie</option>
          <option value="tv">📺 TV Show</option>
          <option value="other">🎲 Other</option>
        </select>
      </div>
      <div style={field}>
        <label style={labelStyle}>IMDB URL <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
        <input type="url" value={form.imdb_url} onChange={set('imdb_url')} placeholder="https://imdb.com/title/..." className={inputClass} style={inputStyle} />
      </div>
      <div style={{ ...field, marginBottom: '16px' }}>
        <label style={labelStyle}>Note <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
        <textarea value={form.description} onChange={set('description')} placeholder="Why should we watch this?" rows={2}
          className={inputClass} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
      </div>
      {error && <p style={{ color: 'var(--danger-text)', fontSize: '13px', margin: '-8px 0 12px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={onClose} style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: '10px', padding: '11px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ flex: 2, background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Activity')}
        </button>
      </div>
    </form>
  )
}

export default function ActivitiesTab({ groupId, onSchedule }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)

  const load = () => {
    setLoading(true); setLoadError(false)
    listActivities(groupId)
      .then((page) => { setActivities(page.results); setNextPage(page.next) })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [groupId])

  const handleLoadMore = async () => {
    if (!nextPage) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(nextPage)
      setActivities(prev => [...prev, ...page.results])
      setNextPage(page.next)
    } catch {
      // leave nextPage as-is so the user can retry
    } finally {
      setLoadingMore(false)
    }
  }

  const handleAdd = async (payload) => {
    const a = await createActivity(groupId, payload)
    setActivities(prev => [a, ...prev])
    return a
  }

  const handleEdit = async (payload) => {
    const a = await updateActivity(editingActivity.id, payload)
    setActivities(prev => prev.map(x => x.id === a.id ? a : x))
    return a
  }

  const handleDelete = async (activity) => {
    if (!window.confirm(`Delete "${activity.title}"?`)) return
    await deleteActivity(activity.id)
    setActivities(prev => prev.filter(x => x.id !== activity.id))
  }

  const handleSchedule = (activity) => {
    onSchedule(activity)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <div className="spinner" />
    </div>
  )

  if (loadError) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed var(--border)', borderRadius: '16px', margin: '16px' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
      <h3 className="display" style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '18px' }}>Couldn't load activities</h3>
      <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 16px' }}>Something went wrong. Please try again.</p>
      <button onClick={load} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
        Retry
      </button>
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      {/* Add form (inline on desktop, slide-up on mobile) */}
      {showForm && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Add an Activity</h3>
          </div>
          <AddForm onSave={handleAdd} onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit form */}
      {editingActivity && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Edit Activity</h3>
          </div>
          <AddForm
            initial={{
              title: editingActivity.title,
              type: editingActivity.type,
              imdb_url: editingActivity.imdb_url || '',
              description: editingActivity.description || '',
            }}
            onSave={handleEdit}
            onClose={() => setEditingActivity(null)}
          />
        </div>
      )}

      {/* Header row */}
      {!showForm && !editingActivity && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--muted)' }}>
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </h2>
          <button onClick={() => setShowForm(true)} style={{
            background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px',
            padding: '9px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            + Add
          </button>
        </div>
      )}

      {/* List */}
      {activities.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍿</div>
          <h3 className="display" style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '18px' }}>No activities yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 16px' }}>Add the first one to get started!</p>
          <button onClick={() => setShowForm(true)} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
            Add Activity
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map(a => (
            <ActivityCard
              key={a.id}
              activity={a}
              onSchedule={() => handleSchedule(a)}
              canManage={user && a.submitted_by === user.id}
              onEdit={() => setEditingActivity(a)}
              onDelete={() => handleDelete(a)}
            />
          ))}
          {nextPage && (
            <button onClick={handleLoadMore} disabled={loadingMore} style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif",
              opacity: loadingMore ? 0.6 : 1, marginTop: '4px',
            }}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
