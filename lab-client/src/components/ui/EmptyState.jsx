import Button from './Button'

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-14 text-center">
      <div className="mb-4 text-4xl">{icon}</div>
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
