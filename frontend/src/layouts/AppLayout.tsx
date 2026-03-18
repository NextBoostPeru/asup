import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { PermisosPorModulo } from '../lib/api'
import { ApiError, apiLogout, apiMisPermisos, clearAuthToken } from '../lib/api'

export function AppLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('asup_sidebar_collapsed') === '1'
  })
  const [permisos, setPermisos] = useState<PermisosPorModulo | null>(null)

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true as const },
      { to: '/instituciones', label: 'Instituciones', icon: 'bi-buildings', modulo: 'instituciones' },
      { to: '/representantes', label: 'Representantes', icon: 'bi-people', modulo: 'representantes' },
      { to: '/reuniones', label: 'Reuniones', icon: 'bi-calendar-event', modulo: 'reuniones' },
      { to: '/alertas', label: 'Alertas', icon: 'bi-bell', modulo: 'alertas' },
      { to: '/usuarios', label: 'Usuarios', icon: 'bi-person-gear', modulo: 'usuarios' },
      { to: '/roles', label: 'Roles', icon: 'bi-shield-check', modulo: 'roles' },
    ],
    [],
  )

  const visibleNavItems = useMemo(() => {
    if (!permisos) {
      return navItems.filter((item) => !('modulo' in item))
    }
    return navItems.filter((item) => {
      if (!('modulo' in item)) return true
      if (!item.modulo) return true
      return Boolean(permisos[item.modulo]?.ver)
    })
  }, [navItems, permisos])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }

    if (!sidebarOpen) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  useEffect(() => {
    localStorage.setItem('asup_sidebar_collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    let cancelled = false
    apiMisPermisos()
      .then((res) => {
        if (cancelled) return
        setPermisos(res.permisos ?? {})
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }
        setPermisos({})
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    function onUnauthorized() {
      clearAuthToken()
      navigate('/login', { replace: true })
    }

    window.addEventListener('asup:unauthorized', onUnauthorized)
    return () => window.removeEventListener('asup:unauthorized', onUnauthorized)
  }, [navigate])

  async function onLogout() {
    await apiLogout().catch(() => null)
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  const linkClass = (isActive: boolean, collapsed: boolean) =>
    isActive
      ? `flex items-center ${collapsed ? 'justify-center' : ''} gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm`
      : `flex items-center ${collapsed ? 'justify-center' : ''} gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900`

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-dvh w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-900">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"
                >
                  <i className="bi bi-grid-1x2-fill text-sm" />
                </span>
                ASUP
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-x-lg" aria-hidden="true" />
                  Cerrar
                </span>
              </button>
            </div>
            <div className="flex h-[calc(100dvh-65px)] flex-col px-3 py-3">
              <nav className="grid gap-1">
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : undefined}
                    className={({ isActive }) => linkClass(isActive, false)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                    >
                      <i className={`bi ${item.icon} text-base`} />
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  type="button"
                  onClick={onLogout}
                >
                  <span className="inline-flex items-center gap-2">
                    <i className="bi bi-box-arrow-right" aria-hidden="true" />
                    Salir
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="w-full">
        <aside
          className={`hidden border-r border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:shadow-sm ${
            sidebarCollapsed ? 'md:w-16' : 'md:w-72'
          }`}
        >
          <div className="border-b border-slate-200 px-3 py-4">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
              {sidebarCollapsed ? (
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  <i className="bi bi-grid-1x2-fill text-sm" aria-hidden="true" />
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold tracking-wide text-slate-900">ASUP</div>
                  <div className="mt-1 text-xs text-slate-500">Panel de administración</div>
                </div>
              )}

              <button
                type="button"
                title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
                className={`rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${
                  sidebarCollapsed ? 'hidden' : ''
                }`}
                onClick={() => setSidebarCollapsed(true)}
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
            </div>

            {sidebarCollapsed ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  title="Expandir"
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="grid gap-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) => linkClass(isActive, sidebarCollapsed)}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                  >
                    <i className={`bi ${item.icon} text-base`} />
                  </span>
                  {sidebarCollapsed ? null : <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-200 p-3">
            <button
              className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 ${
                sidebarCollapsed ? 'w-10 px-0 text-center' : 'w-full text-left'
              }`}
              type="button"
              onClick={onLogout}
              title={sidebarCollapsed ? 'Salir' : undefined}
            >
              {sidebarCollapsed ? (
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
              ) : (
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                  Salir
                </span>
              )}
            </button>
          </div>
        </aside>

        <div
          className={`min-w-0 flex-1 ${sidebarCollapsed ? 'md:pl-16' : 'md:pl-72'}`}
        >
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-list" aria-hidden="true" />
                  Menú
                </span>
              </button>
              <div className="text-sm font-semibold tracking-wide text-slate-900">ASUP</div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={onLogout}
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                  Salir
                </span>
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet context={{ permisos }} />
          </main>
        </div>
      </div>
    </div>
  )
}
