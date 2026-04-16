import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { registerApi } from '../../api/auth.api'
import { googleAuthUrl } from '../../utils/api'

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || 'Unable to register. Please try again.'
}

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
    setError('')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await registerApi(form)
      toast.success(data.message || 'Registration successful')
      navigate('/verify-otp', { state: { email: form.email } })
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
          <Input label="Name" name="name" value={form.name} onChange={onChange} placeholder="Your name" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
          <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="At least 8 characters" />
          <Input
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={onChange}
            placeholder="Repeat password"
          />

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="submit" loading={loading} fullWidth>
            Create Account
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
            window.location.href = googleAuthUrl
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/40 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-surface-raised"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.6 3 14.5 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-surface-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-light">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
