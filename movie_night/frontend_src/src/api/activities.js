import client from './client'

export const listActivities = (groupId) =>
  client.get(`/groups/${groupId}/activities`).then((r) => r.data)

export const createActivity = (groupId, data) =>
  client.post(`/groups/${groupId}/activities`, data).then((r) => r.data)

export const setInterest = (activityId, level) =>
  client.post(`/activities/${activityId}/interest`, { level }).then((r) => r.data)
