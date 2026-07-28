import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGroup, listMembers, buildInviteLink } from '../api/groups'
import Layout from '../components/Layout'
import ActivitiesTab from '../components/ActivitiesTab'
import AvailabilityTab from '../components/AvailabilityTab'

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('activities')
  const [scheduleActivity, setScheduleActivity] = useState(null)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getGroup(id), listMembers(id)])
      .then(([g, m]) => { setGroup(g); setMembers(m) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const copyCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    if (!group) return
    navigator.clipboard.writeText(buildInviteLink(group.invite_code))
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
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

  if (!group) return null

  const tabBtn = (id, label) => (
    <button
      onClick={() => { setTab(id); setScheduleActivity(null) }}
      style={{
        flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '10px 0', fontSize: '14px', fontWeight: tab === id ? 700 : 500,
        color: tab === id ? '#E8A930' : '#9B9BAB',
        borderBottom: `2px solid ${tab === id ? '#E8A930' : 'transparent'}`,
        transition: 'color 0.15s, border-color 0.15s',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {label}
    </button>
  )

  return (
    <Layout groupName={group.name}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Group header */}
        <div style={{ padding: '20px 16px 0', borderBottom: '1px solid #2A2A35' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Link to="/" style={{ color: '#9B9BAB', fontSize: '13px', textDecoration: 'none' }}>Groups</Link>
            <span style={{ color: '#2A2A35' }}>›</span>
            <span style={{ color: '#F5F5F0', fontSize: '13px' }}>{group.name}</span>
          </div>

          {/* Group info row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 className="display" style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.4px' }}>
                {group.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: '#9B9BAB', fontSize: '13px' }}>👥 {members.length} member{members.length !== 1 ? 's' : ''}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontSize: '12px', color: '#E8A930', background: 'rgba(232,169,48,0.1)', padding: '2px 8px', borderRadius: '6px', letterSpacing: '1.5px' }}>
                    {group.invite_code}
                  </code>
                  <button onClick={copyCode} style={{ background: 'transparent', border: 'none', color: '#9B9BAB', fontSize: '12px', cursor: 'pointer', padding: '2px 6px', fontFamily: "'Outfit', sans-serif" }}>
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
                <button onClick={copyLink} style={{ background: linkCopied ? 'rgba(232,169,48,0.15)' : '#1E1E28', border: '1px solid #2A2A35', color: linkCopied ? '#E8A930' : '#9B9BAB', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', fontFamily: "'Outfit', sans-serif", transition: 'background 0.15s, color 0.15s' }}>
                  {linkCopied ? '✓ Invite link copied' : '🔗 Copy invite link'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2A2A35', margin: '0 -0px' }}>
            {tabBtn('activities', '🎬 Activities')}
            {tabBtn('availability', '📅 Availability')}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '0' }}>
          {tab === 'activities' && (
            <ActivitiesTab groupId={id} onSchedule={(activity) => { setScheduleActivity(activity); setTab('availability') }} />
          )}
          {tab === 'availability' && (
            <AvailabilityTab groupId={id} initialView={scheduleActivity ? 'group' : 'mine'} initialActivityId={scheduleActivity?.id} />
          )}
        </div>
      </div>
    </Layout>
  )
}
