import { useState } from 'react'
import AvailabilityCalendar from './AvailabilityCalendar'
import CollatedAvailability from './CollatedAvailability'

export default function AvailabilityTab({ groupId, initialView = 'mine', initialActivityId = null }) {
  const [view, setView] = useState(initialView)

  const segBtn = (id, label) => (
    <button
      onClick={() => setView(id)}
      style={{
        flex: 1, padding: '9px 8px', border: 'none', cursor: 'pointer',
        fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: view === id ? 700 : 500,
        borderRadius: '8px',
        background: view === id ? 'var(--amber)' : 'transparent',
        color: view === id ? 'var(--bg)' : 'var(--muted)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Segmented control */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '3px', gap: '2px',
        }}>
          {segBtn('mine', '📆 My Availability')}
          {segBtn('group', '👥 Group Schedule')}
        </div>
      </div>

      {view === 'mine' && <AvailabilityCalendar groupId={groupId} />}
      {view === 'group' && <CollatedAvailability groupId={groupId} initialActivityId={initialActivityId} />}
    </div>
  )
}
