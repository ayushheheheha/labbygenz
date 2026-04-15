const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function getBackendOrigin() {
  try {
    return new URL(apiBase).origin
  } catch {
    return 'http://localhost:8000'
  }
}

export function resolveMediaUrl(value) {
  if (!value) return ''

  const raw = String(value).trim()
  if (!raw) return ''

  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('data:') ||
    raw.startsWith('blob:')
  ) {
    return raw
  }

  if (raw.startsWith('/')) {
    return `${getBackendOrigin()}${raw}`
  }

  return `${getBackendOrigin()}/${raw}`
}
