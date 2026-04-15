import { NavLink, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/courses', label: 'Courses', icon: '📚' },
  { to: '/admin/quizzes', label: 'Quizzes', icon: '📝' },
  { to: '/admin/ide-problems', label: 'IDE Problems', icon: '💻' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 flex h-screen w-[240px] flex-col border-r border-surface-border bg-[#0b1018] px-4 py-5">
        <h1 className="mb-7 text-2xl font-bold text-brand">LAB Admin</h1>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-brand/20 text-brand-light' : 'text-slate-300 hover:bg-surface-raised'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-surface-border bg-surface-card p-3">
          <p className="text-sm font-medium text-slate-100">{user?.name}</p>
          <button onClick={logout} className="mt-1 text-xs text-danger hover:underline">
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-[240px] px-6 py-6">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
