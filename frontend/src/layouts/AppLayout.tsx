import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { apiLogout, clearAuthToken } from '../lib/api'

export function AppLayout() {
  const navigate = useNavigate()

  async function onLogout() {
    await apiLogout().catch(() => null)
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-slate-900">ASUP</div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/instituciones"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Instituciones
              </NavLink>
              <NavLink
                to="/representantes"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Representantes
              </NavLink>
              <NavLink
                to="/reuniones"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Reuniones
              </NavLink>
              <NavLink
                to="/alertas"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Alertas
              </NavLink>
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                    : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              >
                Usuarios
              </NavLink>
            </nav>
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              type="button"
              onClick={onLogout}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
