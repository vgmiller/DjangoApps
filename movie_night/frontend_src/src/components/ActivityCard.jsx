import { useState } from 'react'
import { setInterest } from '../api/activities'

const TYPE_META = {
  movie: { icon: '🎬', label: 'Movie', color: '#6366F1' },
  tv:    { icon: '📺', label: 'TV Show', color: '#8B5CF6' },
  other: { icon: '🎲', label: 'Other', color: '#EC4899' },
}

const INTEREST_LEVELS = [
  { level: 'definitely_interested', label: 'Definitely', emoji: '✅', bg: '#14532D', color: '#4ADE80', activeBg: '#22C55E', activeColor: '#052E13', glow: '#22C55E' },
  { level: 'sure_why_not',          label: 'Ok',         emoji: '🤷', bg: '#78350F', color: '#FCD34D', activeBg: '#FCD34D', activeColor: '#451A03', glow: '#FCD34D' },
  { level: 'definitely_not',        label: 'Nope', emoji: '❌', bg: '#450A0A', color: '#F87171', activeBg: '#F87171', activeColor: '#450A0A', glow: '#F87171' },
]

export default function ActivityCard({ activity, onSchedule, canManage, onEdit, onDelete }) {
  const [myInterest, setMyInterest] = useState(activity.my_interest)
  const [interests, setInterests] = useState(activity.interests)
  const [saving, setSaving] = useState(false)

  const handleInterest = async (level) => {
    if (saving) return
    const next = myInterest === level ? null : level
    setSaving(true)
    try {
      const updated = await setInterest(activity.id, next || level)
      setMyInterest(updated.my_interest)
      setInterests(updated.interests)
    } catch {}
    finally { setSaving(false) }
  }

  const meta = TYPE_META[activity.type] || TYPE_META.movie

  const tally = {
    definitely_interested: interests.filter(i => i.level === 'definitely_interested').length,
    sure_why_not: interests.filter(i => i.level === 'sure_why_not').length,
    definitely_not: interests.filter(i => i.level === 'definitely_not').length,
  }

  return (
    <div style={{
      background: '#16161D', border: '1px solid #2A2A35', borderRadius: '16px',
      padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
      transition: 'border-color 0.2s',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <span style={{ fontSize: '22px' }}>{meta.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <h3 style={{ margin: '0 0 3px', fontSize: '16px', fontWeight: 700, color: '#F5F5F0', lineHeight: 1.3 }}>
              {activity.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: meta.color, background: `${meta.color}15`, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {meta.label}
              </span>
              {canManage && (
                <>
                  <button
                    onClick={onEdit}
                    title="Edit activity"
                    style={{ background: 'transparent', border: 'none', color: '#9B9BAB', cursor: 'pointer', fontSize: '14px', padding: '2px', lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8A930'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9B9BAB'}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={onDelete}
                    title="Delete activity"
                    style={{ background: 'transparent', border: 'none', color: '#9B9BAB', cursor: 'pointer', fontSize: '14px', padding: '2px', lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9B9BAB'}
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#9B9BAB' }}>Added by {activity.submitted_by_name}</span>
            {activity.imdb_url && (
              <a href={activity.imdb_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: '#F5C518', color: '#0D0D12', textDecoration: 'none',
                  fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px',
                  letterSpacing: '0.2px', transition: 'filter 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                IMDb <span style={{ fontSize: '10px' }}>↗</span>
              </a>
            )}
          </div>
          {activity.description && (
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#9B9BAB', lineHeight: '1.5' }}>{activity.description}</p>
          )}
        </div>
      </div>

      {/* Interest buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {INTEREST_LEVELS.map(({ level, label, emoji, bg, color, activeBg, activeColor, glow }) => {
          const active = myInterest === level
          return (
            <button
              key={level}
              onClick={() => handleInterest(level)}
              disabled={saving}
              style={{
                flex: 1, minWidth: '70px',
                background: active ? activeBg : bg,
                border: `2px solid ${active ? activeBg : 'transparent'}`,
                borderRadius: '10px', padding: '8px 4px',
                color: active ? activeColor : color,
                fontSize: '13px', fontWeight: active ? 800 : 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                opacity: saving ? 0.7 : 1,
                transform: active ? 'scale(1.05)' : 'scale(1)',
                boxShadow: active ? `0 0 0 3px ${glow}33, 0 3px 10px ${glow}66` : 'none',
              }}
            >
              {active && '✓ '}{emoji} {label}
            </button>
          )
        })}
      </div>

      {/* Tally + schedule */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#4ADE80' }}>✅ {tally.definitely_interested}</span>
          <span style={{ fontSize: '12px', color: '#FCD34D' }}>🤷 {tally.sure_why_not}</span>
          <span style={{ fontSize: '12px', color: '#F87171' }}>❌ {tally.definitely_not}</span>
        </div>
        <button
          onClick={() => onSchedule(activity)}
          style={{
            background: 'transparent', border: '1px solid #2A2A35', borderRadius: '8px',
            color: '#9B9BAB', fontSize: '12px', padding: '5px 10px', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#E8A930'; e.currentTarget.style.color='#E8A930' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#2A2A35'; e.currentTarget.style.color='#9B9BAB' }}
        >
          📅 Schedule
        </button>
      </div>
    </div>
  )
}
