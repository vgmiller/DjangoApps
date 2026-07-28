import { useState, useEffect, useMemo, useCallback } from 'react'
import { listActivities } from '../api/activities'
import { getCollatedAvailability, suggestDate } from '../api/availability'

const BASE_HOUR = 10
const SLOT_COUNT = 28
const DAY_COUNT = 28
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getBaseDate() {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d
}

function slotLabel(slotIdx) {
  const h = BASE_HOUR + Math.floor(slotIdx / 2)
  const m = (slotIdx % 2) * 30
  const ampm = h >= 12 ? 'pm' : 'am'
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hr}${ampm}` : `${hr}:${m.toString().padStart(2,'0')}`
}

function dayLabel(baseDate, dayIdx) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + dayIdx)
  return { name: DAY_NAMES[d.getDay()], date: d.getDate(), month: MONTH_NAMES[d.getMonth()] }
}

function collatedToMap(collated, baseDate) {
  const map = new Map()
  for (const slot of collated) {
    const start = new Date(slot.start_time)
    const dayDiff = Math.round((start - baseDate) / 86400000)
    const minutesFromBase = (start.getHours() - BASE_HOUR) * 60 + start.getMinutes()
    const slotIdx = Math.floor(minutesFromBase / 30)
    if (dayDiff >= 0 && dayDiff < DAY_COUNT && slotIdx >= 0 && slotIdx < SLOT_COUNT) {
      map.set(`${dayDiff}-${slotIdx}`, slot)
    }
  }
  return map
}

function cellColor(slot) {
  if (!slot) return '#1A1A24'
  const di = slot.definitely_interested_count
  const swn = slot.sure_why_not_count
  if (di > 0 && swn === 0) return '#16A34A'  // vivid green — all DI
  if (di > 0 && swn > 0)   return '#D97706'  // vivid gold — DI + SWN
  return '#1A1A24'
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
        end_time: slot.end_time,
        message: note || undefined,
      })
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 1800)
    } catch {}
    finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={onClose}>
      <div className="slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#16161D', borderRadius: '20px 20px 0 0', border: '1px solid #2A2A35', borderBottom: 'none', padding: '24px 20px 40px' }}>
        <div style={{ width: '40px', height: '4px', background: '#2A2A35', borderRadius: '2px', margin: '0 auto 18px' }} />

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📨</div>
            <p style={{ color: '#4ADE80', fontWeight: 600, fontSize: '16px', margin: 0 }}>Suggestion sent to the group!</p>
          </div>
        ) : (
          <>
            <h3 className="display" style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#F5F5F0' }}>Suggest this time?</h3>
            <p style={{ color: '#9B9BAB', fontSize: '13px', margin: '0 0 16px' }}>{formatSlotTime(slot.start_time, slot.end_time)}</p>

            <div style={{ background: '#1E1E28', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9B9BAB', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Activity</p>
              <p style={{ margin: 0, color: '#F5F5F0', fontWeight: 600, fontSize: '15px' }}>{activity.title}</p>
            </div>

            {slot.definitely_interested_count > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#4ADE80', fontWeight: 600 }}>✅ Definitely interested & free</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9B9BAB' }}>{slot.definitely_interested_users.join(', ')}</p>
              </div>
            )}
            {slot.sure_why_not_count > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#FCD34D', fontWeight: 600 }}>🤷 Available (Ok)</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9B9BAB' }}>{slot.sure_why_not_users.join(', ')}</p>
              </div>
            )}

            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…" rows={2}
              style={{ width: '100%', background: '#0D0D12', border: '1px solid #2A2A35', borderRadius: '10px', padding: '10px 12px', color: '#F5F5F0', fontSize: '14px', fontFamily: "'Outfit', sans-serif", resize: 'none', marginBottom: '12px' }}
              onFocus={e => e.target.style.borderColor='#E8A930'}
              onBlur={e => e.target.style.borderColor='#2A2A35'}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ flex: 1, background: '#1E1E28', border: '1px solid #2A2A35', color: '#9B9BAB', borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handle} disabled={submitting} style={{ flex: 2, background: '#E8A930', border: 'none', color: '#0D0D12', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", opacity: submitting ? 0.7 : 1 }}>
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
  const [collated, setCollated] = useState([])
  const [slotMap, setSlotMap] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [suggestSlot, setSuggestSlot] = useState(null)

  useEffect(() => {
    listActivities(groupId).then(acts => {
      setActivities(acts)
      if (acts.length > 0) {
        const preselected = initialActivityId && acts.find(a => a.id === initialActivityId)
        setSelectedActivity(preselected || acts[0])
      }
    })
  }, [groupId, initialActivityId])

  useEffect(() => {
    if (!selectedActivity) return
    setLoading(true)
    getCollatedAvailability(groupId, selectedActivity.id)
      .then(data => { setCollated(data); setSlotMap(collatedToMap(data, baseDate)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [groupId, selectedActivity, baseDate])

  const weekStart = weekOffset * 7
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d < DAY_COUNT)
  const timeLabels = Array.from({ length: SLOT_COUNT }, (_, i) => i)

  if (activities.length === 0) return (
    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎬</div>
      <p style={{ color: '#9B9BAB' }}>Add some activities first to see group availability.</p>
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      {/* Activity selector */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', color: '#9B9BAB', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Viewing availability for
        </label>
        <select value={selectedActivity?.id || ''} onChange={e => setSelectedActivity(activities.find(a => a.id === Number(e.target.value)))}
          style={{ width: '100%', background: '#1E1E28', border: '1px solid #2A2A35', borderRadius: '10px', padding: '11px 14px', color: '#F5F5F0', fontSize: '14px', fontFamily: "'Outfit', sans-serif", appearance: 'none', cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor='#E8A930'}
          onBlur={e => e.target.style.borderColor='#2A2A35'}
        >
          {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { color: '#16A34A', label: 'Strongly-Interested People' },
          { color: '#D97706', label: 'Everyone Open to Activity' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#9B9BAB' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
          style={{ background: '#1E1E28', border: '1px solid #2A2A35', borderRadius: '8px', color: weekOffset === 0 ? '#3A3A4A' : '#F5F5F0', width: '32px', height: '32px', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', fontSize: '15px' }}>‹</button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F0' }}>
          {(() => { const l = dayLabel(baseDate, weekStart); const e = dayLabel(baseDate, weekStart + 6); return `${l.month} ${l.date} – ${e.month} ${e.date}` })()}
        </span>
        <button onClick={() => setWeekOffset(w => Math.min(3, w + 1))} disabled={weekOffset === 3}
          style={{ background: '#1E1E28', border: '1px solid #2A2A35', borderRadius: '8px', color: weekOffset === 3 ? '#3A3A4A' : '#F5F5F0', width: '32px', height: '32px', cursor: weekOffset === 3 ? 'not-allowed' : 'pointer', fontSize: '15px' }}>›</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #2A2A35' }} className="no-select">
          <div style={{ minWidth: 'max-content' }}>
            {/* Time header */}
            <div style={{ display: 'flex', background: '#0D0D12', borderBottom: '1px solid #2A2A35' }}>
              <div style={{ width: '52px', flexShrink: 0, borderRight: '1px solid #2A2A35' }} />
              {timeLabels.map(slotIdx => {
                const isHour = slotIdx % 2 === 0
                return (
                  <div key={slotIdx} style={{ width: '32px', flexShrink: 0, height: '24px', borderRight: slotIdx < SLOT_COUNT - 1 ? '1px solid #1A1A24' : 'none', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, bottom: 0,
                      width: isHour ? '2px' : '1px', height: isHour ? '16px' : '4px',
                      background: isHour ? '#9B9BAB' : '#3A3A46',
                    }} />
                    {isHour && (
                      <span style={{
                        position: 'absolute', left: 0, top: '2px', transform: 'translateX(-50%)',
                        fontSize: '9px', color: '#9B9BAB', whiteSpace: 'nowrap',
                      }}>{slotLabel(slotIdx)}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {weekDays.map(dayIdx => {
              const dl = dayLabel(baseDate, dayIdx)
              return (
                <div key={dayIdx} style={{ display: 'flex', borderBottom: dayIdx < weekDays[weekDays.length - 1] ? '1px solid #2A2A35' : 'none' }}>
                  <div style={{ width: '52px', flexShrink: 0, position: 'sticky', left: 0, zIndex: 5, background: '#0D0D12', borderRight: '1px solid #2A2A35', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: '1px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#9B9BAB', textTransform: 'uppercase' }}>{dl.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F0', lineHeight: 1 }}>{dl.date}</span>
                    <span style={{ fontSize: '9px', color: '#9B9BAB' }}>{dl.month}</span>
                  </div>
                  {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => {
                    const key = `${dayIdx}-${slotIdx}`
                    const slot = slotMap.get(key)
                    const bg = cellColor(slot)
                    const hasData = !!slot && slot.definitely_interested_count > 0
                    return (
                      <div
                        key={slotIdx}
                        onClick={() => hasData && setSuggestSlot(slot)}
                        title={hasData ? `${slot.definitely_interested_count} Definitely, ${slot.sure_why_not_count} Ok` : ''}
                        style={{
                          width: '32px', flexShrink: 0, height: '28px',
                          background: bg,
                          borderRight: slotIdx < SLOT_COUNT - 1 ? (slotIdx % 2 === 1 ? '2px solid #3A3A4A' : '1px solid #23232F') : 'none',
                          cursor: hasData ? 'pointer' : 'default',
                          transition: 'filter 0.1s',
                        }}
                        onMouseEnter={e => { if (hasData) e.currentTarget.style.filter='brightness(1.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.filter='none' }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p style={{ color: '#9B9BAB', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
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
