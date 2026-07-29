import client from './client'

// Returns a DRF paginated page ({ results, next, ... }); see fetchPage for paging.
export const listNotifications = () => client.get('/notifications').then((r) => r.data)
export const markRead = (id) => client.patch(`/notifications/${id}/read`).then((r) => r.data)
export const markAllRead = () => client.patch('/notifications/read-all').then((r) => r.data)
