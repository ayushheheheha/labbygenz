import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import { resendOtpApi, verifyOtpApi } from '../../api/auth.api'
import useAuth from '../../hooks/useAuth'

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || 'OTP verification failed.'
}

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [counter, setCounter] = useState(60)
  const inputsRef = useRef([])

  const email = useMemo(() => location.state?.email || '', [location.state])

  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  useEffect(() => {
    if (counter <= 0) return
    const timer = setInterval(() => setCounter((v) => v - 1), 1000)
    return () => clearInterval(timer)
  }, [counter])

  const submitOtp = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await verifyOtpApi({ email, otp })
      login(data.token, data.user)
      toast.success('Email verified successfully')
      navigate(data.user?.is_admin ? '/admin' : '/')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const onInputChange = (index, value) => {
    if (!/^\d?$/.test(value)) return

    const updated = [...digits]
    updated[index] = value
    setDigits(updated)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }

    const otp = updated.join('')
    if (otp.length === 6 && !updated.includes('')) {
      submitOtp(otp)
    }
  }

  const onKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const onResend = async () => {
    if (counter > 0 || resendLoading) return

    setResendLoading(true)
    try {
      await resendOtpApi({ email })
      toast.success('OTP resent successfully')
      setCounter(60)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-surface-border bg-surface-card p-10 shadow-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand">Verify OTP</h1>
          <p className="mt-3 text-sm text-surface-muted">
            Enter the 6-digit code sent to <span className="font-medium text-slate-100">{email}</span>
          </p>
        </div>

        <div className="mt-7 flex justify-center gap-2">
          {digits.map((digit, index) => (
            <input
              key={`otp-${index}`}
              ref={(el) => {
                inputsRef.current[index] = el
              }}
              maxLength={1}
              value={digit}
              onChange={(e) => onInputChange(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(index, e)}
              className="h-12 w-9 rounded-lg border border-surface-border bg-[#0d1117] text-center font-mono text-xl outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          ))}
        </div>

        {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}

        <Button
          className="mt-5"
          type="button"
          fullWidth
          loading={loading}
          onClick={() => {
            const otp = digits.join('')
            if (otp.length === 6 && !digits.includes('')) {
              submitOtp(otp)
            }
          }}
        >
          Verify
        </Button>

        <button
          type="button"
          disabled={counter > 0 || resendLoading}
          onClick={onResend}
          className="mt-4 w-full text-center text-sm text-brand disabled:cursor-not-allowed disabled:text-surface-muted"
        >
          {counter > 0 ? `Resend in ${counter}s` : 'Resend OTP'}
        </button>

        <p className="mt-6 text-center text-sm text-surface-muted">
          Wrong email?{' '}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-light">
            Register again
          </Link>
        </p>
      </div>
    </div>
  )
}
