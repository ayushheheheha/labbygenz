export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card ${className}`}>
      {children}
    </div>
  )
}
