import Button from './Button'
import Icon, { isLikelyEmoji } from './Icon'

const iconAlias = {
  courses: 'courses',
  quiz: 'quiz',
  code: 'code',
  test: 'test',
  puzzle: 'puzzle',
}

export default function EmptyState({ icon = 'inbox', title, description, action }) {
  const resolvedIcon = (() => {
    if (typeof icon === 'string') {
      if (isLikelyEmoji(icon)) return 'inbox'
      return iconAlias[icon] || icon || 'inbox'
    }

    return 'inbox'
  })()

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-14 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface-raised text-surface-muted">
        <Icon name={resolvedIcon} size="xl" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-surface-muted">{description}</p>
      {action ? (
        <Button className="mt-6" onClick={action.onClick} variant={action.variant || 'primary'}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
