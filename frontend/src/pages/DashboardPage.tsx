import { useEffect, useState } from 'react'
import { apiHealth, apiListSectores, getApiBaseUrl, type Sector } from '../lib/api'

type LoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; health: { status: string }; sectores: Sector[] }
  | { status: 'error'; message: string }

export function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all([apiHealth(), apiListSectores()])
      .then(([health, sectores]) => {
        if (cancelled) return
        setState({ status: 'success', health, sectores })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Error desconocido',
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">API base: {getApiBaseUrl()}</p>
      </div>

      {state.status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          Cargando...
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error: {state.message}
        </div>
      ) : state.status === 'success' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Health</div>
            <div className="mt-1 text-base font-medium text-slate-900">{state.health.status}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sectores</div>
            <div className="mt-1 text-base font-medium text-slate-900">{state.sectores.length}</div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
