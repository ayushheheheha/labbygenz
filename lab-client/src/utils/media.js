import { backendBaseUrl, backendOrigin } from './api'

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

  if (raw.startsWith('/public/')) {
    return `${backendOrigin}${raw}`
  }

  if (raw.startsWith('/storage/')) {
    return `${backendBaseUrl}${raw}`
  }

  if (raw.startsWith('/question-images/') || raw.startsWith('/avatars/')) {
    return `${backendBaseUrl}/storage${raw}`
  }

  if (raw.startsWith('/')) {
    return `${backendOrigin}${raw}`
  }

  if (
    raw.startsWith('question-images/') ||
    raw.startsWith('avatars/')
  ) {
    return `${backendBaseUrl}/storage/${raw}`
  }

  if (raw.startsWith('public/')) {
    return `${backendOrigin}/${raw}`
  }

  if (raw.startsWith('storage/')) {
    return `${backendBaseUrl}/${raw}`
  }

  return `${backendBaseUrl}/${raw}`
}
