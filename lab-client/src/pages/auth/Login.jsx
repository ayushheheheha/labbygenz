import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { loginApi } from '../../api/auth.api'
import useAuth from '../../hooks/useAuth'

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || 'Unable to sign in. Please try again.'
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
    setError('')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await loginApi(form)
      login(data.token, data.user)
      toast.success('Signed in successfully')
      navigate(data.user?.is_admin ? '/admin' : '/')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-surface-border bg-surface-card p-10 shadow-card">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand">LAB</h1>
          <p className="mt-1 text-sm text-surface-muted">by GenZIITian</p>
          <p className="mt-4 text-xs text-surface-muted">IITM BS Degree Practice Platform</p>
        </div>

        <div className="my-6 h-px w-full bg-surface-border" />

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            placeholder="you@example.com"
            onChange={onChange}
          />

          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            placeholder="Enter your password"
            onChange={onChange}
            rightElement={(
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-2 text-xs text-surface-muted hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
          />

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="submit" loading={loading} fullWidth>
            Sign In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-surface-muted">
          <div className="h-px flex-1 bg-surface-border" />
          <span>or</span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = 'http://localhost:8000/api/auth/google'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/40 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-surface-raised"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.6 3 14.5 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-surface-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-light">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
