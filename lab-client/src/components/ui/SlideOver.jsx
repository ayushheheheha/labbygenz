import { useEffect } from 'react'

export default function SlideOver({
  isOpen,
  onClose,
  title,
  width = '600px',
  children,
}) {
  useEffect(() => {
    if (!isOpen) return
    const onEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [isOpen, onClose])

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full max-w-[100vw] flex-col border-l border-surface-border bg-surface-card shadow-card transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: `min(${width}, 100vw)` }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-surface-muted hover:bg-surface-raised hover:text-white">
            x
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  )
}
