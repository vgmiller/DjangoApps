import { useState, useEffect, useRef, useCallback } from 'react'
import { listNotifications, markAllRead, markRead } from '../api/notifications'

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await listNotifications()
      setNotifs(data)
    } catch {}
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const unread = notifs.filter(n => !n.read).length

  const handleMarkAll = async () => {
    await markAllRead()
    setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  }

  const handleMarkOne = async (id) => {
    await markRead(id)
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="hover-amber-border"
        style={{
          position: 'relative', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'var(--amber)', color: 'var(--bg)',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in" style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 'min(340px, calc(100vw - 32px))',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ background: 'transparent', border: 'none', color: 'var(--amber)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍿</div>
                Nothing yet
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkOne(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--surface-2)',
                  background: n.read ? 'transparent' : 'rgba(232,169,48,0.05)',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}
              >
                {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '5px' }} />}
                {n.read && <div style={{ width: '6px', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>{n.message}</p>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
