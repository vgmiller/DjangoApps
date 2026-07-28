import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getMyAvailability, submitAvailability } from '../api/availability'
import { BASE_HOUR, SLOT_COUNT, DAY_COUNT, MAX_WEEK_OFFSET, getBaseDate, slotLabel, dayLabel } from '../utils/calendarGrid'

function cellToLocalDate(baseDate, dayIdx, slotIdx) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + dayIdx)
  d.setHours(BASE_HOUR + Math.floor(slotIdx / 2))
  d.setMinutes((slotIdx % 2) * 30)
  d.setSeconds(0, 0)
  return d
}

function apiSlotsToSelected(apiSlots, baseDate) {
  const selected = new Set()
  for (const slot of apiSlots) {
    const start = new Date(slot.start_time)
    const end = new Date(slot.end_time)
    for (let d = 0; d < DAY_COUNT; d++) {
      for (let s = 0; s < SLOT_COUNT; s++) {
        const cellStart = cellToLocalDate(baseDate, d, s)
        const cellEnd = new Date(cellStart.getTime() + 30 * 60 * 1000)
        if (cellStart >= start && cellEnd <= end) selected.add(`${d}-${s}`)
      }
    }
  }
  return selected
}

function selectedToApiSlots(selected, baseDate) {
  const byDay = {}
  for (const key of selected) {
    const [d, s] = key.split('-').map(Number)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(s)
  }
  const slots = []
  for (const [dayStr, slotNums] of Object.entries(byDay)) {
    const d = Number(dayStr)
    const sorted = slotNums.sort((a, b) => a - b)
    let rStart = sorted[0], rEnd = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === rEnd + 1) { rEnd = sorted[i] }
      else {
        slots.push({ start_time: cellToLocalDate(baseDate, d, rStart).toISOString(), end_time: new Date(cellToLocalDate(baseDate, d, rEnd).getTime() + 30 * 60 * 1000).toISOString() })
        rStart = rEnd = sorted[i]
      }
    }
    slots.push({ start_time: cellToLocalDate(baseDate, d, rStart).toISOString(), end_time: new Date(cellToLocalDate(baseDate, d, rEnd).getTime() + 30 * 60 * 1000).toISOString() })
  }
  return slots
}

export default function AvailabilityCalendar({ groupId }) {
  const baseDate = useMemo(getBaseDate, [])
  const [selected, setSelected] = useState(new Set())
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Drag state
  const isDragging = useRef(false)
  const dragMode = useRef(null) // 'add' | 'remove'

  useEffect(() => {
    getMyAvailability(groupId)
      .then(data => setSelected(apiSlotsToSelected(data.slots || [], baseDate)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [groupId, baseDate])

  const toggleCell = useCallback((key) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const applyCell = useCallback((key) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (dragMode.current === 'add') next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const onCellMouseDown = useCallback((key) => {
    isDragging.current = true
    dragMode.current = selected.has(key) ? 'remove' : 'add'
    applyCell(key)
  }, [selected, applyCell])

  const onCellMouseEnter = useCallback((key) => {
    if (!isDragging.current) return
    applyCell(key)
  }, [applyCell])

  useEffect(() => {
    const up = () => { isDragging.current = false }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await submitAvailability(groupId, selectedToApiSlots(selected, baseDate))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    finally { setSaving(false) }
  }

  // Which days to show (7 per week)
  const weekStart = weekOffset * 7
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d < DAY_COUNT)

  // Time labels — show every hour (every 2 slots)
  const timeLabels = Array.from({ length: SLOT_COUNT }, (_, i) => ({
    idx: i, label: i % 2 === 0 ? slotLabel(i) : '', isHour: i % 2 === 0,
  }))

  const cellH = 28  // px height per slot

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: weekOffset === 0 ? 'var(--disabled)' : 'var(--text)', width: '36px', height: '36px', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
            {(() => { const l = dayLabel(baseDate, weekStart); const e = dayLabel(baseDate, weekStart + 6); return `${l.month} ${l.date} – ${e.month} ${e.date}` })()}
          </span>
          <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Week {weekOffset + 1} of {MAX_WEEK_OFFSET + 1}</div>
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(MAX_WEEK_OFFSET, w + 1))} disabled={weekOffset === MAX_WEEK_OFFSET}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: weekOffset === MAX_WEEK_OFFSET ? 'var(--disabled)' : 'var(--text)', width: '36px', height: '36px', cursor: weekOffset === MAX_WEEK_OFFSET ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
          ›
        </button>
      </div>

      {/* Grid instructions */}
      <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '0 0 10px', textAlign: 'center' }}>
        Click or drag to mark when you're free, <strong>and click the "Save Availability" button below</strong>
      </p>

      {/* Grid: rows=days, cols=time slots */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }} className="no-select">
        <div style={{ minWidth: 'max-content' }}>
          {/* Time header */}
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '52px', flexShrink: 0, borderRight: '1px solid var(--border)' }} />
            {timeLabels.map(({ idx, label, isHour }) => (
              <div key={idx} style={{
                width: '32px', flexShrink: 0, height: '28px',
                borderRight: idx < SLOT_COUNT - 1 ? '1px solid var(--grid-empty)' : 'none',
                position: 'relative',
              }}>
                {/* tick mark at the left edge of this column — bold/tall on the hour, thin/short on the half-hour */}
                <div style={{
                  position: 'absolute', left: 0, bottom: 0,
                  width: isHour ? '2px' : '1px', height: isHour ? '16px' : '4px',
                  background: isHour ? 'var(--muted)' : 'var(--grid-tick)',
                }} />
                {isHour && (
                  <span style={{
                    position: 'absolute', left: 0, top: '2px', transform: 'translateX(-50%)',
                    fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap',
                  }}>{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {weekDays.map(dayIdx => {
            const dl = dayLabel(baseDate, dayIdx)
            const isToday = dayIdx === 0
            return (
              <div key={dayIdx} style={{ display: 'flex', borderBottom: dayIdx < weekDays[weekDays.length - 1] ? '1px solid var(--border)' : 'none' }}>
                {/* Day label (sticky left) */}
                <div style={{
                  width: '52px', flexShrink: 0, position: 'sticky', left: 0, zIndex: 5,
                  background: 'var(--bg)', borderRight: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px', gap: '1px',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: isToday ? 'var(--amber)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{dl.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: isToday ? 'var(--amber)' : 'var(--text)', lineHeight: 1 }}>{dl.date}</span>
                  <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{dl.month}</span>
                </div>

                {/* Time slots */}
                {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => {
                  const key = `${dayIdx}-${slotIdx}`
                  const isSel = selected.has(key)
                  const isHourBorder = slotIdx % 2 === 1  // right edge of an odd slot = start of the next hour
                  return (
                    <div
                      key={slotIdx}
                      onMouseDown={() => onCellMouseDown(key)}
                      onMouseEnter={() => onCellMouseEnter(key)}
                      onTouchStart={(e) => { e.preventDefault(); toggleCell(key) }}
                      style={{
                        width: '32px', flexShrink: 0, height: `${cellH}px`,
                        background: isSel ? 'var(--grid-selected)' : 'var(--grid-empty)',
                        borderRight: slotIdx < SLOT_COUNT - 1 ? (isHourBorder ? '2px solid var(--disabled)' : '1px solid var(--grid-line)') : 'none',
                        cursor: 'pointer', transition: 'background 0.08s',
                        boxSizing: 'border-box',
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend + Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'var(--grid-selected)' }} />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>I'm free</span>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'var(--grid-empty)', border: '1px solid var(--border)' }} />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Busy</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {selected.size} slot{selected.size !== 1 ? 's' : ''} selected
          </span>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saved ? '#166534' : 'var(--amber)', border: 'none', color: saved ? 'var(--success)' : 'var(--bg)', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  )
}
