import { backendBaseUrl } from './api'

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
    return `${backendBaseUrl}${raw}`
  }

  return `${backendBaseUrl}/${raw}`
}
