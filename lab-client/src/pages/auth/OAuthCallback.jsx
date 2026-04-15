import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { meApi } from '../../api/auth.api'

function parseUserPayload(raw) {
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    // Try once-decoded payload.
  }

  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    // Some backends encode spaces as +.
  }

  try {
    return JSON.parse(decodeURIComponent(raw.replace(/\+/g, '%20')))
  } catch {
    return null
  }
}

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [params] = useSearchParams()

  useEffect(() => {
    const completeSignIn = async () => {
      const token = params.get('token')
      const userParam = params.get('user')
      const error = params.get('error')

      if (error || !token) {
        toast.error('Google sign-in failed')
        navigate('/login', { replace: true })
        return
      }

      const parsedUser = parseUserPayload(userParam)
      if (parsedUser) {
        login(token, parsedUser)
        window.location.replace(parsedUser?.is_admin ? '/admin' : '/')
        return
      }

      // Fallback when user payload encoding breaks: use token to fetch profile.
      try {
        localStorage.setItem('lab_token', token)
        const { data } = await meApi()
        const nextUser = data?.user

        if (!nextUser) {
          throw new Error('Missing user profile')
        }

        login(token, nextUser)
        window.location.replace(nextUser?.is_admin ? '/admin' : '/')
      } catch {
        localStorage.removeItem('lab_token')
        localStorage.removeItem('lab_user')
        toast.error('Could not complete Google sign-in')
        navigate('/login', { replace: true })
      }
    }

    completeSignIn()
  }, [login, navigate, params])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4 text-surface-muted">
        <Spinner size="lg" />
        <p>Signing you in...</p>
      </div>
    </div>
  )
}
