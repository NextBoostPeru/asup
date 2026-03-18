import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { PermisosPorModulo, RbacModulo, Rol, RolCreateInput, RolPermisosInput, RolUpdateInput } from '../lib/api'
import { ApiError, apiCreateRol, apiDeleteRol, apiListRoles, apiRbacModulos, apiUpdateRol } from '../lib/api'

type OutletCtx = { permisos: PermisosPorModulo | null }

type ModalState =
  | { open: false }
  | {
      open: true
      mode: 'create' | 'edit'
      rol?: Rol
    }

type PermRow = { ver: boolean; agregar: boolean; editar: boolean; eliminar: boolean }

export function RolesPage() {
  const { permisos } = useOutletContext<OutletCtx>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Rol[]>([])
  const [modulos, setModulos] = useState<RbacModulo[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ open: false })

  const canView = permisos?.roles?.ver ?? false
  const canCreate = permisos?.roles?.agregar ?? false
  const canEdit = permisos?.roles?.editar ?? false
  const canDelete = permisos?.roles?.eliminar ?? false

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const [r, m] = await Promise.all([apiListRoles(), apiRbacModulos()])
      setRoles(r)
      setModulos(m.modulos)
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return roles
    return roles.filter((r) => {
      const hay = `${r.nombre} ${r.slug} ${r.descripcion ?? ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [q, roles])

  if (!canView) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900">Acceso restringido</div>
        <p className="mt-2 text-sm text-slate-600">No tienes permisos para ver el módulo de roles.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">Administración</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Roles y permisos</h1>
          <p className="mt-2 text-sm text-slate-600">
            Define accesos por módulo: ver, agregar, editar y eliminar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            onClick={() => void reload()}
            disabled={loading}
          >
            <i className="bi bi-arrow-repeat" aria-hidden="true" />
            Actualizar
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setModal({ open: true, mode: 'create' })}
            disabled={!canCreate}
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Crear rol
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-lg">
            <i
              className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, slug o descripción"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div className="text-sm text-slate-600">
            {filtered.length} {filtered.length === 1 ? 'rol' : 'roles'}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Rol</th>
                  <th className="hidden px-4 py-3 md:table-cell">Descripción</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map((rol) => (
                  <tr key={rol.id_rol} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{rol.nombre}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{rol.slug}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-700 md:table-cell">
                      {rol.descripcion ? rol.descripcion : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {rol.es_sistema ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                          <i className="bi bi-lock" aria-hidden="true" />
                          Sistema
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          <i className="bi bi-sliders" aria-hidden="true" />
                          Personalizado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                          onClick={() => setModal({ open: true, mode: 'edit', rol })}
                          disabled={!canEdit}
                          title="Editar"
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                          onClick={async () => {
                            if (!canDelete || rol.es_sistema) return
                            const ok = window.confirm(
                              `¿Eliminar el rol "${rol.nombre}"?\n\nEsta acción no se puede deshacer.`,
                            )
                            if (!ok) return
                            try {
                              await apiDeleteRol(rol.id_rol)
                              setRoles((prev) => prev.filter((x) => x.id_rol !== rol.id_rol))
                            } catch (e: unknown) {
                              setError(getErrorMessage(e))
                            }
                          }}
                          disabled={!canDelete || rol.es_sistema}
                          title={rol.es_sistema ? 'No se puede eliminar rol del sistema' : 'Eliminar'}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-600" colSpan={4}>
                      No hay roles para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal.open ? (
        <RoleModal
          saving={saving}
          mode={modal.mode}
          rol={modal.rol}
          modulos={modulos}
          onClose={() => setModal({ open: false })}
          onSave={async (payload) => {
            setSaving(true)
            setError(null)
            try {
              if (modal.mode === 'create') {
                const created = await apiCreateRol(payload as RolCreateInput)
                setRoles((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                setModal({ open: false })
              } else {
                const id = modal.rol?.id_rol
                if (!id) return
                const updated = await apiUpdateRol(id, payload as RolUpdateInput)
                setRoles((prev) => prev.map((x) => (x.id_rol === id ? updated : x)).sort((a, b) => a.nombre.localeCompare(b.nombre)))
                setModal({ open: false })
              }
            } catch (e: unknown) {
              setError(getErrorMessage(e))
            } finally {
              setSaving(false)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function RoleModal({
  mode,
  rol,
  modulos,
  saving,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  rol?: Rol
  modulos: RbacModulo[]
  saving: boolean
  onClose: () => void
  onSave: (payload: RolCreateInput | RolUpdateInput) => Promise<void>
}) {
  const [nombre, setNombre] = useState(rol?.nombre ?? '')
  const [slug, setSlug] = useState(rol?.slug ?? '')
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? '')
  const [permMap, setPermMap] = useState<Record<string, PermRow>>(() => {
    const map: Record<string, PermRow> = {}
    for (const m of modulos) {
      map[m.key] = { ver: false, agregar: false, editar: false, eliminar: false }
    }
    const existing = rol?.modulo_permisos ?? []
    for (const p of existing) {
      map[p.modulo] = {
        ver: Boolean(p.puede_ver),
        agregar: Boolean(p.puede_agregar),
        editar: Boolean(p.puede_editar),
        eliminar: Boolean(p.puede_eliminar),
      }
    }
    return map
  })
  const [formError, setFormError] = useState<string | null>(null)

  const isSystem = Boolean(rol?.es_sistema)
  const title = mode === 'create' ? 'Crear rol' : 'Editar rol'

  const permisosInput = useMemo(() => toPermisosInput(permMap), [permMap])
  const canSubmit = useMemo(() => {
    if (saving) return false
    if (nombre.trim().length === 0) return false
    if (!isSystem && slug.trim().length === 0) return false
    if (permisosInput.length === 0) return false
    return true
  }, [saving, nombre, slug, permisosInput.length, isSystem])

  function updatePerm(modulo: string, patch: Partial<PermRow>) {
    setPermMap((prev) => {
      const curr = prev[modulo] ?? { ver: false, agregar: false, editar: false, eliminar: false }
      const next: PermRow = { ...curr, ...patch }
      if (!next.ver) {
        next.agregar = false
        next.editar = false
        next.eliminar = false
      } else {
        if (next.agregar || next.editar || next.eliminar) next.ver = true
      }
      return { ...prev, [modulo]: next }
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
      <div className="flex min-h-[calc(100dvh-32px)] items-end justify-center sm:items-center">
        <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-48px)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-500">Roles</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            disabled={saving}
          >
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-x-lg" aria-hidden="true" />
              Cerrar
            </span>
          </button>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={async (e) => {
              e.preventDefault()
              setFormError(null)
              const finalNombre = nombre.trim()
              const finalSlug = slug.trim()
              const permisos = toPermisosInput(permMap)
              if (finalNombre.length === 0) {
                setFormError('El nombre es obligatorio.')
                return
              }
              if (!isSystem && finalSlug.length === 0) {
                setFormError('El slug es obligatorio.')
                return
              }
              if (permisos.length === 0) {
                setFormError('Debes habilitar al menos un permiso.')
                return
              }

              const payload: RolCreateInput | RolUpdateInput =
                mode === 'edit' && isSystem
                  ? {
                      descripcion: descripcion.trim().length > 0 ? descripcion.trim() : null,
                      permisos,
                    }
                  : {
                      nombre: finalNombre,
                      slug: finalSlug,
                      descripcion: descripcion.trim().length > 0 ? descripcion.trim() : null,
                      permisos,
                    }
              await onSave(payload)
            }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-5">
                {formError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-slate-800" htmlFor="nombre">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                      disabled={saving || (mode === 'edit' && isSystem)}
                      required
                    />
                  </div>

                  <div className="grid gap-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-slate-800" htmlFor="slug">
                      Slug
                    </label>
                    <input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                      disabled={saving || (mode === 'edit' && isSystem)}
                      required={!isSystem}
                    />
                  </div>

                  <div className="grid gap-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-slate-800" htmlFor="descripcion">
                      Descripción
                    </label>
                    <input
                      id="descripcion"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-800">Permisos por módulo</div>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setPermMap((prev) => {
                          const next: Record<string, PermRow> = { ...prev }
                          for (const key of Object.keys(next)) {
                            next[key] = { ver: false, agregar: false, editar: false, eliminar: false }
                          }
                          return next
                        })
                      }}
                      disabled={saving}
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="grid">
                    <div className="hidden grid-cols-12 gap-0 border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:grid">
                      <div className="col-span-5">Módulo</div>
                      <div className="col-span-7 grid grid-cols-4 text-center">
                        <div>Ver</div>
                        <div>Agregar</div>
                        <div>Editar</div>
                        <div>Eliminar</div>
                      </div>
                    </div>
                    {modulos.map((m) => {
                      const row = permMap[m.key] ?? { ver: false, agregar: false, editar: false, eliminar: false }
                      return (
                        <div key={m.key} className="border-b border-slate-200 last:border-b-0">
                          <div className="grid gap-3 px-4 py-3 sm:hidden">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{m.label}</div>
                              <div className="text-xs text-slate-500">{m.key}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                Ver
                                <input
                                  type="checkbox"
                                  checked={row.ver}
                                  onChange={(e) => updatePerm(m.key, { ver: e.target.checked })}
                                  disabled={saving}
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                                />
                              </label>
                              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                Agregar
                                <input
                                  type="checkbox"
                                  checked={row.agregar}
                                  onChange={(e) => updatePerm(m.key, { ver: true, agregar: e.target.checked })}
                                  disabled={saving || !row.ver}
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                                />
                              </label>
                              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                Editar
                                <input
                                  type="checkbox"
                                  checked={row.editar}
                                  onChange={(e) => updatePerm(m.key, { ver: true, editar: e.target.checked })}
                                  disabled={saving || !row.ver}
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                                />
                              </label>
                              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                Eliminar
                                <input
                                  type="checkbox"
                                  checked={row.eliminar}
                                  onChange={(e) => updatePerm(m.key, { ver: true, eliminar: e.target.checked })}
                                  disabled={saving || !row.ver}
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="hidden grid-cols-12 items-center gap-0 px-4 py-2 sm:grid">
                            <div className="col-span-5">
                              <div className="text-sm font-medium text-slate-900">{m.label}</div>
                              <div className="text-xs text-slate-500">{m.key}</div>
                            </div>
                            <div className="col-span-7 grid grid-cols-4 justify-items-center">
                              <input
                                type="checkbox"
                                checked={row.ver}
                                onChange={(e) => updatePerm(m.key, { ver: e.target.checked })}
                                disabled={saving}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900"
                              />
                              <input
                                type="checkbox"
                                checked={row.agregar}
                                onChange={(e) => updatePerm(m.key, { ver: true, agregar: e.target.checked })}
                                disabled={saving || !row.ver}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                              />
                              <input
                                type="checkbox"
                                checked={row.editar}
                                onChange={(e) => updatePerm(m.key, { ver: true, editar: e.target.checked })}
                                disabled={saving || !row.ver}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                              />
                              <input
                                type="checkbox"
                                checked={row.eliminar}
                                onChange={(e) => updatePerm(m.key, { ver: true, eliminar: e.target.checked })}
                                disabled={saving || !row.ver}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 disabled:opacity-40"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmit}
                >
                  {saving ? (
                    <>
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2" aria-hidden="true" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function toPermisosInput(map: Record<string, PermRow>): RolPermisosInput {
  const out: RolPermisosInput = []
  for (const modulo of Object.keys(map)) {
    const row = map[modulo]
    const any = row.ver || row.agregar || row.editar || row.eliminar
    if (!any) continue
    out.push({
      modulo,
      puede_ver: row.ver,
      puede_agregar: row.agregar,
      puede_editar: row.editar,
      puede_eliminar: row.eliminar,
    })
  }
  return out
}

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    const maybeJson = safeJsonParse(err.bodyText)
    if (maybeJson && typeof maybeJson === 'object' && 'message' in maybeJson) {
      const message = (maybeJson as { message?: unknown }).message
      if (typeof message === 'string' && message.trim().length > 0) return message
    }
    return `No se pudo completar la operación. (${err.status})`
  }

  if (err instanceof Error && err.message.trim().length > 0) return err.message
  return 'Ocurrió un error inesperado.'
}

function safeJsonParse(text?: string) {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}
