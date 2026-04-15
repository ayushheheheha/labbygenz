import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { useState } from 'react'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
          <Link to="/" className="text-2xl font-bold text-brand">
            LAB
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-surface-muted md:flex">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-white')}>
              My Courses
            </NavLink>
            <button
              onClick={() => navigate('/')}
              className="hover:text-white"
            >
              Progress
            </button>
          </nav>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-sm"
            >
              <img
                src={user?.avatar || 'https://api.dicebear.com/9.x/initials/svg?seed=LAB'}
                alt="avatar"
                className="h-7 w-7 rounded-full"
              />
              <span className="hidden md:block">{user?.name}</span>
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-surface-border bg-surface-card p-1 shadow-card">
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate('/')
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-surface-raised"
                >
                  Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
