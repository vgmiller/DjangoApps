import client from './client'

export const listActivities = (groupId) =>
  client.get(`/groups/${groupId}/activities`).then((r) => r.data)

export const createActivity = (groupId, data) =>
  client.post(`/groups/${groupId}/activities`, data).then((r) => r.data)

export const setInterest = (activityId, level) =>
  client.post(`/activities/${activityId}/interest`, { level }).then((r) => r.data)

export const updateActivity = (activityId, data) =>
  client.patch(`/activities/${activityId}`, data).then((r) => r.data)

export const deleteActivity = (activityId) =>
  client.delete(`/activities/${activityId}`).then((r) => r.data)
