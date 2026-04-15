export default function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = '0.5rem',
  className = '',
}) {
  return (
    <div
      className={`relative overflow-hidden bg-surface-raised ${className}`}
      style={{ width, height, borderRadius: rounded }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(30,42,58,0) 0%, rgba(122,143,166,0.22) 50%, rgba(30,42,58,0) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.3s infinite',
        }}
      />
    </div>
  )
}
