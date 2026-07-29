import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroup, listMembers } from '../api/groups'
import { fetchPage } from '../api/client'
import Layout from '../components/Layout'

export default function GroupMembers() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = () => {
    setLoading(true); setLoadError(false)
    Promise.all([getGroup(id), listMembers(id)])
      .then(([g, page]) => { setGroup(g); setMembers(page.results); setNextPage(page.next) })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleLoadMore = async () => {
    if (!nextPage) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(nextPage)
      setMembers(prev => [...prev, ...page.results])
      setNextPage(page.next)
    } catch {
      // leave nextPage as-is so the user can retry
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  if (loadError || !group) {
    return (
      <Layout>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 20px' }}>
          <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed var(--border)', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
            <h3 className="display" style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '18px' }}>Couldn't load members</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 16px' }}>Something went wrong. Please try again.</p>
            <button onClick={load} style={{ background: 'var(--amber)', border: 'none', color: 'var(--bg)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout groupName={group.name}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ padding: '20px 16px 0' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Link to="/" style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>Groups</Link>
            <span style={{ color: 'var(--border)' }}>›</span>
            <Link to={`/groups/${id}`} style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>{group.name}</Link>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--text)', fontSize: '13px' }}>Members</span>
          </div>

          <h1 className="display" style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>
            Members
          </h1>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            {members.map(m => (
              <div key={m.user_id} style={{
                display: 'flex', flexDirection: 'column', gap: '2px',
                padding: '12px 16px', borderBottom: '1px solid var(--surface-2)', background: 'var(--surface)',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{m.name}</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{m.email}</span>
              </div>
            ))}
          </div>

          {nextPage && (
            <button onClick={handleLoadMore} disabled={loadingMore} style={{
              display: 'block', width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif",
              opacity: loadingMore ? 0.6 : 1, marginTop: '12px',
            }}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
