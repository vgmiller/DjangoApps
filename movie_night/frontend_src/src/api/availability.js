import client from './client'

export const submitAvailability = (groupId, slots) =>
  client.post(`/groups/${groupId}/availability`, { slots }).then((r) => r.data)

export const getMyAvailability = (groupId) =>
  client.get(`/groups/${groupId}/availability/me`).then((r) => r.data)

export const getCollatedAvailability = (groupId, activityId) =>
  client.get(`/groups/${groupId}/availability/${activityId}`).then((r) => r.data)

export const suggestDate = (groupId, data) =>
  client.post(`/groups/${groupId}/suggest`, data).then((r) => r.data)
