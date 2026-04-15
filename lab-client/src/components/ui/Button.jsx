import Spinner from './Spinner'

const variantMap = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:translate-y-[1px] shadow-glow',
  secondary: 'bg-surface-raised text-slate-100 border border-surface-border hover:bg-[#232d40]',
  danger: 'bg-danger text-white hover:bg-red-600',
  ghost: 'bg-transparent text-slate-200 hover:bg-surface-raised',
}

const sizeMap = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  className = '',
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantMap[variant] || variantMap.primary} ${sizeMap[size] || sizeMap.md} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner size="sm" color="white" /> : null}
      {children}
    </button>
  )
}
