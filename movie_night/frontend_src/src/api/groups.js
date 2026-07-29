import client from './client'

export const createGroup = (data) => client.post('/groups', data).then((r) => r.data)
export const listGroups = () => client.get('/groups').then((r) => r.data)
export const getGroup = (id) => client.get(`/groups/${id}`).then((r) => r.data)
export const joinGroup = (invite_code) => client.post('/groups/join', { invite_code }).then((r) => r.data)
// Returns a DRF paginated page ({ results, next, ... }); see fetchPage for paging.
export const listMembers = (id) => client.get(`/groups/${id}/members`).then((r) => r.data)

// Unauthenticated lookup, used to show "You've been invited to <name>" on
// the /join/:code landing page before the visitor has signed in.
export const previewInvite = (invite_code) => client.get(`/groups/invite/${invite_code}`).then((r) => r.data)

export const buildInviteLink = (invite_code) => `${window.location.origin}/movie_night/join/${invite_code}`
