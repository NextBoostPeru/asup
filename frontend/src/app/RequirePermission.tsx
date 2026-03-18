import type { ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { PermisosPorModulo } from '../lib/api'

export function RequirePermission({ modulo, children }: { modulo: string; children: ReactNode }) {
  const { permisos } = useOutletContext<{ permisos: PermisosPorModulo | null }>()
  if (!permisos) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900">Cargando permisos</div>
        <p className="mt-2 text-sm text-slate-600">Verificando acceso al módulo...</p>
      </div>
    )
  }
  if (permisos && !permisos[modulo]?.ver) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900">Acceso restringido</div>
        <p className="mt-2 text-sm text-slate-600">No tienes permisos para ver este módulo.</p>
      </div>
    )
  }
  return children
}
