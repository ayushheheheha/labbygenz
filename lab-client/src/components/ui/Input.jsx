export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  name,
  rightElement,
}) {
  return (
    <div className="w-full space-y-1.5">
      {label ? <label className="block text-sm text-surface-muted">{label}</label> : null}
      <div className="relative">
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-xl border bg-[#0d1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70 ${error ? 'border-danger' : 'border-surface-border'}`}
        />
        {rightElement ? <div className="absolute inset-y-0 right-2 flex items-center">{rightElement}</div> : null}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}
