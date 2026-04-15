const sizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

const iconPaths = {
  home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z',
  courses: 'M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5V6.5z M4 20.5A2.5 2.5 0 0 1 6.5 18H20v2.5H6.5A2.5 2.5 0 0 0 4 23z',
  quiz: 'M7 4h10l3 3v13H7z M17 4v4h4 M11 12h5 M11 16h5 M11 8h2',
  code: 'M8 9l-4 3 4 3 M16 9l4 3-4 3 M13 6l-2 12',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 0 4 23z',
  practice: 'M12 3l2.5 5.2L20 9l-4 3.8 1 5.7L12 16l-5 2.5 1-5.7L4 9l5.5-.8L12 3z',
  flag: 'M6 3v18 M7 4h10l-2.5 4 2.5 4H7z',
  inbox: 'M3 6h18l-2 10H5L3 6z M3 11h5l2 2h4l2-2h5',
  test: 'M9 3h6 M10 3v4l-4 7a4 4 0 0 0 3.5 6h5a4 4 0 0 0 3.5-6l-4-7V3',
  puzzle: 'M9 5h3a2 2 0 1 1 0 4H9v3a2 2 0 1 1-4 0V9H3V5h2a2 2 0 1 0 4 0z M15 9h3v3a2 2 0 1 1 0 4h-3v3h-3v-3a2 2 0 1 1 0-4h3z',
  users: 'M8.5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z M16.5 13a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z M2 21a6.5 6.5 0 0 1 13 0 M13 21a5.5 5.5 0 0 1 9 0',
  question: 'M9.5 9a2.5 2.5 0 1 1 4.3 1.8c-.8.7-1.3 1.2-1.3 2.2 M12 18h.01',
  trend: 'M4 16l5-5 4 3 6-7 M20 7h-5V2',
  chat: 'M4 5h16v11H9l-5 4V5z',
  number: 'M9 4l-2 16 M15 4l-2 16 M4 9h16 M3 15h16',
  check: 'M5 12l4 4 10-10',
  x: 'M6 6l12 12 M18 6L6 18',
  warning: 'M12 3l9 17H3l9-17z M12 9v5 M12 17h.01',
  clock: 'M12 5v7l4 2',
  arrowLeft: 'M14 6l-6 6 6 6 M8 12h12',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  drag: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  edit: 'M4 20h4l10-10-4-4L4 16v4z M13 7l4 4',
  trash: 'M4 7h16 M9 7V4h6v3 M8 7l1 13h6l1-13',
  dot: 'M12 12h.01',
  circle: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  checkSquare: 'M5 5h14v14H5z M8 12l3 3 5-6',
}

export function isLikelyEmoji(value) {
  if (!value || typeof value !== 'string') return false
  return [...value].some((ch) => ch.charCodeAt(0) > 127)
}

export default function Icon({
  name = 'dot',
  size = 'md',
  className = '',
  strokeWidth = 1.8,
}) {
  const px = typeof size === 'number' ? size : sizeMap[size] || sizeMap.md
  const path = iconPaths[name] || iconPaths.dot

  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export function CourseIcon({ value, className = '', size = 'xl' }) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
      return <img src={trimmed} alt="course" className={className} />
    }

    if (!trimmed || isLikelyEmoji(trimmed)) {
      return <Icon name="book" size={size} className={className} />
    }
  }

  return <Icon name="book" size={size} className={className} />
}
