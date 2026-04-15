const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

const colorMap = {
  brand: 'border-brand border-t-transparent',
  white: 'border-white border-t-transparent',
  muted: 'border-surface-muted border-t-transparent',
}

export default function Spinner({ size = 'md', color = 'brand' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full ${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.brand}`}
      aria-label="Loading"
    />
  )
}
