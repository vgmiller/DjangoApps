import { useState, useEffect, useMemo } from 'react'
import { listActivities } from '../api/activities'
import { getCollatedAvailability, suggestDate } from '../api/availability'
import { BASE_HOUR, SLOT_COUNT, DAY_COUNT, MAX_WEEK_OFFSET, getBaseDate, slotLabel, dayLabel } from '../utils/calendarGrid'

function collatedToMap(collated, baseDate) {
  const map = new Map()
  for (const slot of collated) {
    const start = new Date(slot.start_time)
    const dayDiff = Math.floor((start - baseDate) / 86400000)
    const minutesFromBase = (start.getHours() - BASE_HOUR) * 60 + start.getMinutes()
    const slotIdx = Math.floor(minutesFromBase / 30)
    if (dayDiff >= 0 && dayDiff < DAY_COUNT && slotIdx >= 0 && slotIdx < SLOT_COUNT) {
      map.set(`${dayDiff}-${slotIdx}`, slot)
    }
  }
  return map
}

function cellColor(slot) {
  if (!slot) return 'var(--grid-empty)'
  const di = slot.definitely_interested_count
  const swn = slot.sure_why_not_count
  if (di > 0 && swn > 0) return 'var(--success)'         // bright green — overlap of DI and SWN
  if (di > 0)             return 'var(--info-vivid)'      // medium blue — only DI available
  if (swn > 0)             return 'var(--warning)'        // medium yellow — only SWN available
  return 'var(--grid-empty)'
}

function slotTooltip(slot) {
  const parts = []
  if (slot.definitely_interested_count > 0) {
    parts.push(`${slot.definitely_interested_count} Definitely (${slot.definitely_interested_users.join(', ')})`)
  }
  if (slot.sure_why_not_count > 0) {
    parts.push(`${slot.sure_why_not_count} Ok (${slot.sure_why_not_users.join(', ')})`)
  }
  return parts.join(', ')
}

function formatSlotTime(start, end) {
  const s = new Date(start), e = new Date(end)
  const fmt = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const fmtDay = d => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return `${fmtDay(s)}, ${fmt(s)}–${fmt(e)}`
}

function SuggestPanel({ slot, activity, groupId, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handle = async () => {
    setSubmitting(true)
    try {
      await suggestDate(groupId, {
        activity_id: activity.id,
        start_time: slot.start_time,
        message: note || undefined,
      })
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 1800)
    } catch {}
    finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in modal-overlay modal-overlay-bottom" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="slide-up modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: '24px 20px 40px' }}>
        <div className="modal-drag-handle" style={{ margin: '0 auto 18px' }} />

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📨</div>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '16px', margin: 0 }}>Suggestion sent to the group!</p>
          </div>
        ) : (
          <>
            <h3 className="display" style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Suggest this time?</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px' }}>{formatSlotTime(slot.start_time, slot.end_time)}</p>

            <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Activity</p>
              <p style={{ margin: 0, color: 'var(--text)', fontWeight: 600, fontSize: '15px' }}>{activity.title}</p>
            </div>

            {slot.definitely_interested_count > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>✅ Definitely interested & free</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{slot.definitely_interested_users.join(', ')}</p>
              </div>
            )}
            {slot.sure_why_not_count > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>🤷 Available (Ok)</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{slot.sure_why_not_users.join(', ')}</p>
              </div>
            )}

            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…" rows={2}
              className="form-input"
              style={{ padding: '10px 12px', fontSize: '14px', resize: 'none', marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handle} disabled={submitting} style={{ flex: 2, background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Sending…' : 'Send Suggestion 📨'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CollatedAvailability({ groupId, initialActivityId }) {
  const baseDate = useMemo(getBaseDate, [])
  const [activities, setActivities] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [slotMap, setSlotMap] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [suggestSlot, setSuggestSlot] = useState(null)
  const [activitiesError, setActivitiesError] = useState(false)

  useEffect(() => {
    setActivitiesError(false)
    listActivities(groupId).then(page => {
      const acts = page.results
      setActivities(acts)
      if (acts.length > 0) {
        const preselected = initialActivityId && acts.find(a => a.id === initialActivityId)
        setSelectedActivity(preselected || acts[0])
      }
    }).catch(() => setActivitiesError(true))
  }, [groupId, initialActivityId])

  useEffect(() => {
    if (!selectedActivity) return
    setLoading(true)
    getCollatedAvailability(groupId, selectedActivity.id)
      .then(data => setSlotMap(collatedToMap(data, baseDate)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [groupId, selectedActivity, baseDate])

  const weekStart = weekOffset * 7
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d < DAY_COUNT)
  const timeLabels = Array.from({ length: SLOT_COUNT }, (_, i) => i)

  if (activitiesError) return (
    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
      <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>Couldn't load activities. Please try again.</p>
      <button onClick={() => { setActivitiesError(false); listActivities(groupId).then(page => { const acts = page.results; setActivities(acts); if (acts.length > 0) { const preselected = initialActivityId && acts.find(a => a.id === initialActivityId); setSelectedActivity(preselected || acts[0]) } }).catch(() => setActivitiesError(true)) }} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
        Retry
      </button>
    </div>
  )

  if (activities.length === 0) return (
    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎬</div>
      <p style={{ color: 'var(--muted)' }}>Add some activities first to see group availability.</p>
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      {/* Activity selector */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Viewing availability for
        </label>
        <select value={selectedActivity?.id || ''} onChange={e => setSelectedActivity(activities.find(a => a.id === Number(e.target.value)))}
          className="form-input"
          style={{ background: 'var(--surface-2)', padding: '11px 14px', fontSize: '14px', appearance: 'none', cursor: 'pointer' }}
        >
          {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { color: 'var(--info-vivid)', label: "Only 'Definitely Interested' folks" },
          { color: 'var(--warning)', label: "Only 'Ok Interested' folks" },
          { color: 'var(--success)', label: 'Overlap (best availability/most people)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: weekOffset === 0 ? 'var(--disabled)' : 'var(--text)', width: '32px', height: '32px', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', fontSize: '15px' }}>‹</button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          {(() => { const l = dayLabel(baseDate, weekStart); const e = dayLabel(baseDate, weekStart + 6); return `${l.month} ${l.date} – ${e.month} ${e.date}` })()}
        </span>
        <button onClick={() => setWeekOffset(w => Math.min(MAX_WEEK_OFFSET, w + 1))} disabled={weekOffset === MAX_WEEK_OFFSET}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: weekOffset === MAX_WEEK_OFFSET ? 'var(--disabled)' : 'var(--text)', width: '32px', height: '32px', cursor: weekOffset === MAX_WEEK_OFFSET ? 'not-allowed' : 'pointer', fontSize: '15px' }}>›</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }} className="no-select">
          <div style={{ minWidth: 'max-content' }}>
            {/* Time header */}
            <div style={{ display: 'flex', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '52px', flexShrink: 0, borderRight: '1px solid var(--border)' }} />
              {timeLabels.map(slotIdx => {
                const isHour = slotIdx % 2 === 0
                return (
                  <div key={slotIdx} style={{ width: '32px', flexShrink: 0, height: '28px', borderRight: slotIdx < SLOT_COUNT - 1 ? '1px solid var(--grid-empty)' : 'none', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, bottom: 0,
                      width: isHour ? '2px' : '1px', height: isHour ? '16px' : '4px',
                      background: isHour ? 'var(--muted)' : 'var(--grid-tick)',
                    }} />
                    {isHour && (
                      <span style={{
                        position: 'absolute', left: 0, top: '2px', transform: 'translateX(-50%)',
                        fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap',
                      }}>{slotLabel(slotIdx)}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {weekDays.map(dayIdx => {
              const dl = dayLabel(baseDate, dayIdx)
              return (
                <div key={dayIdx} style={{ display: 'flex', borderBottom: dayIdx < weekDays[weekDays.length - 1] ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: '52px', flexShrink: 0, position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: '1px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{dl.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{dl.date}</span>
                    <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{dl.month}</span>
                  </div>
                  {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => {
                    const key = `${dayIdx}-${slotIdx}`
                    const slot = slotMap.get(key)
                    const bg = cellColor(slot)
                    const hasData = !!slot && (slot.definitely_interested_count > 0 || slot.sure_why_not_count > 0)
                    return (
                      <div
                        key={slotIdx}
                        onClick={() => hasData && setSuggestSlot(slot)}
                        title={hasData ? slotTooltip(slot) : ''}
                        className={hasData ? 'grid-cell-active' : ''}
                        style={{
                          width: '32px', flexShrink: 0, height: '28px',
                          background: bg,
                          borderRight: slotIdx < SLOT_COUNT - 1 ? (slotIdx % 2 === 1 ? '2px solid var(--disabled)' : '1px solid var(--grid-line)') : 'none',
                          cursor: hasData ? 'pointer' : 'default',
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
        Click any colored slot to suggest that time to the group
      </p>

      {suggestSlot && selectedActivity && (
        <SuggestPanel
          slot={suggestSlot}
          activity={selectedActivity}
          groupId={groupId}
          onClose={() => setSuggestSlot(null)}
          onDone={() => setSuggestSlot(null)}
        />
      )}
    </div>
  )
}
