import client from './client'

// `data` may include `invite_code` (from an invite link) -- the backend
// joins the group as part of register/login when it's present.
export const register = (data) => client.post('/auth/register', data).then((r) => r.data)
export const login = (data) => client.post('/auth/login', data).then((r) => r.data)
export const logout = () => client.post('/auth/logout').then((r) => r.data)
export const getMe = () => client.get('/auth/me').then((r) => r.data)
