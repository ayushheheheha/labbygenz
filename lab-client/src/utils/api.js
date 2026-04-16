const rawApiUrl = import.meta.env.VITE_API_URL || 'https://labapi.genziitian.in/public/api'

function normalizeApiBase(url) {
  const trimmed = String(url || '').trim().replace(/\/+$/, '')
  if (!trimmed) return 'https://labapi.genziitian.in/public/api'
  if (/\/public\/api$/i.test(trimmed) || /\/api$/i.test(trimmed)) return trimmed

  try {
    const parsed = new URL(trimmed)
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)
    return `${trimmed}${isLocal ? '/api' : '/public/api'}`
  } catch {
    return `${trimmed}/api`
  }
}

export const apiBaseUrl = normalizeApiBase(rawApiUrl)
export const backendOrigin = (() => {
  try {
    return new URL(apiBaseUrl).origin
  } catch {
    return 'https://labapi.genziitian.in'
  }
})()
export const backendBaseUrl = apiBaseUrl.replace(/\/api$/i, '')
export const googleAuthUrl = `${apiBaseUrl}/auth/google`
