import axios from 'axios'

// Django backend uses session-cookie auth (DRF SessionAuthentication), not
// JWT bearer tokens. The Vite dev server proxies /movie_night to the Django
// dev server (see vite.config.js) so the session cookie is same-site and no
// CORS configuration is needed. `withCredentials: true` ensures the
// sessionid cookie is sent/received on every request.
const client = axios.create({ baseURL: '/movie_night/api', withCredentials: true })

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

client.interceptors.request.use((config) => {
  if (UNSAFE_METHODS.has((config.method || '').toLowerCase())) {
    const csrfToken = getCookie('csrftoken')
    if (csrfToken) config.headers['X-CSRFToken'] = csrfToken
  }
  return config
})

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/movie_night/login')) {
      window.location.href = '/movie_night/login'
    }
    return Promise.reject(err)
  }
)

// DRF errors come back in different shapes depending on the failure:
// {"detail": "..."} for auth/permission errors, {"field": ["msg", ...]} for
// serializer validation errors, {"non_field_errors": ["msg"]} for
// cross-field validation, or occasionally a plain string. Flatten whatever
// we got into one human-readable message.
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail

  const messages = []
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) messages.push(...value)
    else if (typeof value === 'string') messages.push(value)
  }
  return messages.length ? messages.join(' ') : fallback
}

export default client
