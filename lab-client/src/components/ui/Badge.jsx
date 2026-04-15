const variantMap = {
  success: 'bg-success/10 text-success border border-success/25',
  warning: 'bg-warning/10 text-warning border border-warning/25',
  danger: 'bg-danger/10 text-danger border border-danger/25',
  info: 'bg-brand/10 text-brand-light border border-brand/25',
  default: 'bg-surface-raised text-slate-300 border border-surface-border',
}

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export default function Badge({ variant = 'default', size = 'md', children }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantMap[variant] || variantMap.default} ${sizeMap[size] || sizeMap.md}`}>
      {children}
    </span>
  )
}
