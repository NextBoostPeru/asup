import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
    ApiError,
    apiCreateUsuario,
    apiDeactivateUsuario,
    apiForgotPassword,
    apiListUsuarios,
    apiMe,
    apiRbacRoles,
    apiUpdateUsuario,
    type PermisosPorModulo,
    type RolOption,
    type Usuario,
} from '../lib/api'

type ModalMode = 'create' | 'edit'
type ToastType = 'success' | 'error' | 'info'

type Toast = {
    id: string
    type: ToastType
    title: string
    message?: string
}

type ConfirmState =
    | {
          open: false
      }
    | {
          open: true
          title: string
          message: string
          confirmText: string
          tone: 'danger' | 'primary'
          onConfirm: () => Promise<void>
      }

export function UsuariosPage() {
    const { permisos } = useOutletContext<{ permisos: PermisosPorModulo | null }>()
    const [me, setMe] = useState<Usuario | null>(null)
    const [loadingMe, setLoadingMe] = useState(true)
    const [loadingList, setLoadingList] = useState(true)
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [roles, setRoles] = useState<RolOption[]>([])

    const [q, setQ] = useState('')
    const [estado, setEstado] = useState<Usuario['estado'] | ''>('')
    const [rol, setRol] = useState<string | ''>('')

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<ModalMode>('create')
    const [editingId, setEditingId] = useState<number | null>(null)

    const [formNombres, setFormNombres] = useState('')
    const [formApellidos, setFormApellidos] = useState('')
    const [formCorreo, setFormCorreo] = useState('')
    const [formIdRol, setFormIdRol] = useState<number | null>(null)
    const [formEstado, setFormEstado] = useState<Usuario['estado']>('activo')
    const [formPassword, setFormPassword] = useState('')
    const [formEmailVerificadoEn, setFormEmailVerificadoEn] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)

    const [confirm, setConfirm] = useState<ConfirmState>({ open: false })
    const [toasts, setToasts] = useState<Toast[]>([])
    const toastTimersRef = useRef<Record<string, number>>({})

    const canView = permisos?.usuarios?.ver ?? false
    const canAdd = permisos?.usuarios?.agregar ?? false
    const canEdit = permisos?.usuarios?.editar ?? false
    const canDelete = permisos?.usuarios?.eliminar ?? false

    const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
        const full: Toast = { ...toast, id }
        setToasts((prev) => [full, ...prev].slice(0, 4))
        const t = window.setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id))
            delete toastTimersRef.current[id]
        }, 4200)
        toastTimersRef.current[id] = t
    }, [])

    useEffect(() => {
        const timers = toastTimersRef.current
        return () => {
            for (const id of Object.keys(timers)) {
                window.clearTimeout(timers[id])
            }
        }
    }, [])

    useEffect(() => {
        async function loadMe() {
            setLoadingMe(true)
            try {
                const res = await apiMe()
                setMe(res.usuario)
            } catch (err: unknown) {
                pushToast({ type: 'error', title: 'No se pudo cargar tu sesión', message: getErrorMessage(err) })
            } finally {
                setLoadingMe(false)
            }
        }

        void loadMe()
    }, [pushToast])

    useEffect(() => {
        apiRbacRoles()
            .then((res) => setRoles(res.roles))
            .catch(() => null)
    }, [])

    const reloadList = useCallback(async () => {
        setLoadingList(true)
        try {
            const list = await apiListUsuarios()
            setUsuarios(list)
        } catch (err: unknown) {
            pushToast({ type: 'error', title: 'No se pudo cargar usuarios', message: getErrorMessage(err) })
        } finally {
            setLoadingList(false)
        }
    }, [pushToast])

    useEffect(() => {
        if (!me) return
        if (!canView) return
        void reloadList()
    }, [me, reloadList, canView])

    const stats = useMemo(() => {
        const total = usuarios.length
        const activos = usuarios.filter((u) => u.estado === 'activo').length
        const inactivos = usuarios.filter((u) => u.estado === 'inactivo').length
        const suspendidos = usuarios.filter((u) => u.estado === 'suspendido').length
        const verificados = usuarios.filter((u) => u.email_verificado_en !== null).length
        return { total, activos, inactivos, suspendidos, verificados }
    }, [usuarios])

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase()
        return usuarios.filter((u) => {
            if (estado && u.estado !== estado) return false
            if (rol && u.rol !== rol) return false
            if (!needle) return true
            return (
                u.nombres.toLowerCase().includes(needle) ||
                (u.apellidos ? u.apellidos.toLowerCase().includes(needle) : false) ||
                u.correo.toLowerCase().includes(needle) ||
                String(u.id_usuario).includes(needle)
            )
        })
    }, [usuarios, q, estado, rol])

    const filtersActive = q.trim().length > 0 || estado !== '' || rol !== ''

    function resetFilters() {
        setQ('')
        setEstado('')
        setRol('')
    }

    function openCreate() {
        if (!canAdd) return
        setModalMode('create')
        setEditingId(null)
        setFormNombres('')
        setFormApellidos('')
        setFormCorreo('')
        setFormIdRol(roles.find((r) => r.slug === 'visor')?.id_rol ?? null)
        setFormEstado('activo')
        setFormPassword('')
        setFormEmailVerificadoEn(null)
        setShowPassword(false)
        setModalOpen(true)
    }

    function openEdit(usuario: Usuario) {
        if (!canEdit) return
        setModalMode('edit')
        setEditingId(usuario.id_usuario)
        setFormNombres(usuario.nombres)
        setFormApellidos(usuario.apellidos ?? '')
        setFormCorreo(usuario.correo)
        setFormIdRol(usuario.id_rol ?? roles.find((r) => r.slug === usuario.rol)?.id_rol ?? null)
        setFormEstado(usuario.estado)
        setFormPassword('')
        setFormEmailVerificadoEn(usuario.email_verificado_en)
        setShowPassword(false)
        setModalOpen(true)
    }

    const canSave = useMemo(() => {
        if (saving) return false
        if (formNombres.trim().length < 3) return false
        if (formApellidos.trim().length < 3) return false
        if (!isProbablyEmail(formCorreo.trim())) return false
        if (!formIdRol) return false
        if (modalMode === 'create' && formPassword.length < 8) return false
        if (formPassword.length > 0 && formPassword.length < 8) return false
        return true
    }, [saving, formNombres, formApellidos, formCorreo, formIdRol, formPassword, modalMode])

    if (loadingMe) {
        return (
            <section>
                <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
                <p className="mt-2 text-sm text-slate-600">Cargando...</p>
            </section>
        )
    }

    if (!me) {
        return (
            <section>
                <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
                <p className="mt-2 text-sm text-red-700">No autenticado.</p>
            </section>
        )
    }

    if (!canView) {
        return (
            <section>
                <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
                <p className="mt-2 text-sm text-slate-700">No tienes permisos para gestionar usuarios.</p>
            </section>
        )
    }

    return (
        <section className="relative">
            <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(420px,calc(100vw-32px))] flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={toastClass(t.type)}
                        role={t.type === 'error' ? 'alert' : 'status'}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <i className={toastIcon(t.type)} aria-hidden="true" />
                                    <span className="truncate">{t.title}</span>
                                </div>
                                {t.message ? <div className="mt-1 text-sm opacity-90">{t.message}</div> : null}
                            </div>
                            <button
                                type="button"
                                className="pointer-events-auto rounded-lg p-1.5 opacity-70 hover:bg-white/20 hover:opacity-100"
                                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                                aria-label="Cerrar"
                            >
                                <i className="bi bi-x" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                        <i className="bi bi-shield-lock" aria-hidden="true" />
                        Administración
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">Usuarios</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Controla accesos, roles, estados y recuperación de contraseña.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => void reloadList()}
                        disabled={loadingList}
                    >
                        <i className={`bi ${loadingList ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'}`} aria-hidden="true" />
                        Actualizar
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        onClick={openCreate}
                        disabled={!canAdd}
                    >
                        <i className="bi bi-person-plus" aria-hidden="true" />
                        Crear usuario
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Total" value={stats.total} icon="bi-people" tone="slate" />
                <StatCard label="Activos" value={stats.activos} icon="bi-check-circle" tone="emerald" />
                <StatCard label="Inactivos" value={stats.inactivos} icon="bi-pause-circle" tone="amber" />
                <StatCard label="Suspendidos" value={stats.suspendidos} icon="bi-slash-circle" tone="rose" />
                <StatCard label="Verificados" value={stats.verificados} icon="bi-patch-check" tone="indigo" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-slate-800" htmlFor="q">
                                Buscar
                            </label>
                            <div className="relative">
                                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                <input
                                    id="q"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                    placeholder="Nombre, correo o ID"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                                {q.trim().length > 0 ? (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                        onClick={() => setQ('')}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <i className="bi bi-x-lg" aria-hidden="true" />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-slate-800" htmlFor="estado">
                                Estado
                            </label>
                            <select
                                id="estado"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value as Usuario['estado'] | '')}
                            >
                                <option value="">Todos</option>
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                                <option value="suspendido">Suspendido</option>
                            </select>
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-slate-800" htmlFor="rol">
                                Rol
                            </label>
                                            <select
                                id="rol"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                value={rol}
                                                onChange={(e) => setRol(e.target.value as string | '')}
                            >
                                <option value="">Todos</option>
                                                {roles.map((r) => (
                                                    <option key={r.id_rol} value={r.slug}>
                                                        {r.nombre}
                                                    </option>
                                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-600">
                            {loadingList ? 'Cargando...' : `${filtered.length} resultado(s)`}
                        </span>
                        {filtersActive ? (
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                                onClick={resetFilters}
                            >
                                <i className="bi bi-eraser" aria-hidden="true" />
                                Limpiar filtros
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Verificación</th>
                                    <th className="px-4 py-3">Creación</th>
                                    <th className="px-4 py-3">Último acceso</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingList ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
                                                    <div className="min-w-0">
                                                        <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
                                                        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="ml-auto h-8 w-28 animate-pulse rounded-xl bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr className="bg-white">
                                        <td className="px-4 py-8" colSpan={7}>
                                            <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                                    <i className="bi bi-people" aria-hidden="true" />
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900">Sin resultados</div>
                                                <div className="text-sm text-slate-600">
                                                    Prueba ajustando la búsqueda o limpiando filtros.
                                                </div>
                                                {filtersActive ? (
                                                    <button
                                                        type="button"
                                                        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                                                        onClick={resetFilters}
                                                    >
                                                        <i className="bi bi-eraser" aria-hidden="true" />
                                                        Limpiar filtros
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                                        onClick={openCreate}
                                                    >
                                                        <i className="bi bi-person-plus" aria-hidden="true" />
                                                        Crear primer usuario
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u) => (
                                        <tr key={u.id_usuario} className="bg-white hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                                                        {initials(`${u.nombres} ${u.apellidos ?? ''}`.trim())}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="truncate text-sm font-semibold text-slate-900">
                                                                {`${u.nombres} ${u.apellidos ?? ''}`.trim()}
                                                            </div>
                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                                ID {u.id_usuario}
                                                            </span>
                                                        </div>
                                                        <div className="truncate text-sm text-slate-600">{u.correo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{roleBadge(u.rol)}</td>
                                            <td className="px-4 py-3">{estadoBadge(u.estado)}</td>
                                            <td className="px-4 py-3">
                                                {u.email_verificado_en ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                                                        <i className="bi bi-patch-check" aria-hidden="true" />
                                                        Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                                                        <i className="bi bi-envelope" aria-hidden="true" />
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDate(u.fecha_creacion)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {u.ultimo_acceso ? formatDate(u.ultimo_acceso) : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        onClick={() => openEdit(u)}
                                                        title="Editar"
                                                        disabled={!canEdit}
                                                    >
                                                        <i className="bi bi-pencil" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Enviar recuperación por correo"
                                                        disabled={!canEdit}
                                                        onClick={() => {
                                                            setConfirm({
                                                                open: true,
                                                                title: 'Enviar recuperación',
                                                                message: `Se enviará un correo de recuperación a ${u.correo}.`,
                                                                confirmText: 'Enviar',
                                                                tone: 'primary',
                                                                onConfirm: async () => {
                                                                    await apiForgotPassword(u.correo)
                                                                    pushToast({
                                                                        type: 'success',
                                                                        title: 'Correo enviado',
                                                                        message: 'Si la cuenta existe, recibirá el enlace de recuperación.',
                                                                    })
                                                                },
                                                            })
                                                        }}
                                                    >
                                                        <i className="bi bi-envelope" aria-hidden="true" />
                                                    </button>

                                                    {u.estado !== 'activo' ? (
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Activar"
                                                            disabled={!canEdit}
                                                            onClick={() => {
                                                                setConfirm({
                                                                    open: true,
                                                                    title: 'Activar usuario',
                                                                    message: `El usuario ${`${u.nombres} ${u.apellidos ?? ''}`.trim()} pasará a estado activo.`,
                                                                    confirmText: 'Activar',
                                                                    tone: 'primary',
                                                                    onConfirm: async () => {
                                                                        const updated = await apiUpdateUsuario(u.id_usuario, { estado: 'activo' })
                                                                        setUsuarios((prev) =>
                                                                            prev.map((x) => (x.id_usuario === u.id_usuario ? updated : x)),
                                                                        )
                                                                        pushToast({ type: 'success', title: 'Usuario activado' })
                                                                    },
                                                                })
                                                            }}
                                                        >
                                                            <i className="bi bi-check-lg" aria-hidden="true" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Suspender"
                                                            disabled={!canEdit}
                                                            onClick={() => {
                                                                setConfirm({
                                                                    open: true,
                                                                    title: 'Suspender usuario',
                                                                    message: `El usuario ${`${u.nombres} ${u.apellidos ?? ''}`.trim()} pasará a estado suspendido.`,
                                                                    confirmText: 'Suspender',
                                                                    tone: 'danger',
                                                                    onConfirm: async () => {
                                                                        const updated = await apiUpdateUsuario(u.id_usuario, { estado: 'suspendido' })
                                                                        setUsuarios((prev) =>
                                                                            prev.map((x) => (x.id_usuario === u.id_usuario ? updated : x)),
                                                                        )
                                                                        pushToast({ type: 'info', title: 'Usuario suspendido' })
                                                                    },
                                                                })
                                                            }}
                                                        >
                                                            <i className="bi bi-slash-circle" aria-hidden="true" />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Desactivar"
                                                        disabled={!canDelete}
                                                        onClick={() => {
                                                            setConfirm({
                                                                open: true,
                                                                title: 'Desactivar usuario',
                                                                message: `El usuario ${`${u.nombres} ${u.apellidos ?? ''}`.trim()} quedará inactivo. Su historial se conserva.`,
                                                                confirmText: 'Desactivar',
                                                                tone: 'danger',
                                                                onConfirm: async () => {
                                                                    const updated = await apiDeactivateUsuario(u.id_usuario)
                                                                    setUsuarios((prev) =>
                                                                        prev.map((x) => (x.id_usuario === u.id_usuario ? updated : x)),
                                                                    )
                                                                    pushToast({ type: 'info', title: 'Usuario desactivado' })
                                                                },
                                                            })
                                                        }}
                                                    >
                                                        <i className="bi bi-person-dash" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen ? (
                <div className="fixed inset-0 z-50">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/40"
                        aria-label="Cerrar"
                        onClick={() => (saving ? null : setModalOpen(false))}
                    />

                    <div className="absolute left-1/2 top-8 w-[min(780px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                                    <i className="bi bi-person-badge" aria-hidden="true" />
                                    Gestión de usuarios
                                </div>
                                <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                                    {modalMode === 'create' ? 'Crear usuario' : 'Editar usuario'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                disabled={saving}
                                onClick={() => setModalOpen(false)}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <i className="bi bi-x-lg" aria-hidden="true" />
                                    Cerrar
                                </span>
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-sm font-semibold text-slate-900">Datos</div>
                                <div className="mt-3 grid gap-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-slate-800" htmlFor="formNombres">
                                                Nombres
                                            </label>
                                            <input
                                                id="formNombres"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                                value={formNombres}
                                                onChange={(e) => setFormNombres(e.target.value)}
                                                disabled={saving}
                                                required
                                            />
                                            {formNombres.trim().length > 0 && formNombres.trim().length < 3 ? (
                                                <div className="text-xs text-rose-700">Mínimo 3 caracteres.</div>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-slate-800" htmlFor="formApellidos">
                                                Apellidos
                                            </label>
                                            <input
                                                id="formApellidos"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                                value={formApellidos}
                                                onChange={(e) => setFormApellidos(e.target.value)}
                                                disabled={saving}
                                                required
                                            />
                                            {formApellidos.trim().length > 0 && formApellidos.trim().length < 3 ? (
                                                <div className="text-xs text-rose-700">Mínimo 3 caracteres.</div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-slate-800" htmlFor="formCorreo">
                                            Correo
                                        </label>
                                        <input
                                            id="formCorreo"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                            type="email"
                                            value={formCorreo}
                                            onChange={(e) => setFormCorreo(e.target.value)}
                                            disabled={saving}
                                            required
                                        />
                                        {formCorreo.trim().length > 0 && !isProbablyEmail(formCorreo.trim()) ? (
                                            <div className="text-xs text-rose-700">Correo inválido.</div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="text-sm font-semibold text-slate-900">Acceso</div>
                                <div className="mt-3 grid gap-3">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <div className="grid gap-1.5">
                                                        <label className="text-sm font-medium text-slate-800" htmlFor="formRol">
                                                            Rol
                                                        </label>
                                                        <select
                                                            id="formRol"
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                                            value={formIdRol ?? ''}
                                                            onChange={(e) =>
                                                                setFormIdRol(e.target.value ? Number(e.target.value) : null)
                                                            }
                                                            disabled={saving}
                                                            required
                                                        >
                                                            <option value="" disabled>
                                                                Selecciona un rol
                                                            </option>
                                                            {roles.map((r) => (
                                                                <option key={r.id_rol} value={r.id_rol}>
                                                                    {r.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-slate-800" htmlFor="formEstado">
                                                Estado
                                            </label>
                                            <select
                                                id="formEstado"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                                value={formEstado}
                                                onChange={(e) => setFormEstado(e.target.value as Usuario['estado'])}
                                                disabled={saving}
                                            >
                                                <option value="activo">Activo</option>
                                                <option value="inactivo">Inactivo</option>
                                                <option value="suspendido">Suspendido</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <label className="text-sm font-medium text-slate-800" htmlFor="formPassword">
                                                {modalMode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                    disabled={saving}
                                                    onClick={() => setShowPassword((v) => !v)}
                                                >
                                                    {showPassword ? 'Ocultar' : 'Mostrar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                    disabled={saving}
                                                    onClick={() => setFormPassword(generatePassword())}
                                                >
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            id="formPassword"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            disabled={saving}
                                            required={modalMode === 'create'}
                                            minLength={modalMode === 'create' ? 8 : undefined}
                                            placeholder={modalMode === 'create' ? 'Mínimo 8 caracteres' : 'Dejar vacío para no cambiar'}
                                        />
                                        {formPassword.length > 0 && formPassword.length < 8 ? (
                                            <div className="text-xs text-rose-700">Mínimo 8 caracteres.</div>
                                        ) : null}
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300"
                                            checked={formEmailVerificadoEn !== null}
                                            onChange={(e) => setFormEmailVerificadoEn(e.target.checked ? new Date().toISOString() : null)}
                                            disabled={saving}
                                        />
                                        Correo verificado
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                disabled={saving}
                                onClick={() => setModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                disabled={!canSave}
                                onClick={async () => {
                                    setSaving(true)
                                    try {
                                        if (modalMode === 'create') {
                                            let created = await apiCreateUsuario({
                                                nombres: formNombres.trim(),
                                                apellidos: formApellidos.trim(),
                                                correo: formCorreo.trim(),
                                                password: formPassword,
                                                id_rol: formIdRol,
                                                estado: formEstado,
                                            })
                                            if (formEmailVerificadoEn) {
                                                created = await apiUpdateUsuario(created.id_usuario, { email_verificado_en: formEmailVerificadoEn })
                                            }
                                            setUsuarios((prev) =>
                                                [...prev, created].sort((a, b) =>
                                                    `${a.nombres} ${a.apellidos ?? ''}`.trim().localeCompare(`${b.nombres} ${b.apellidos ?? ''}`.trim())
                                                )
                                            )
                                            pushToast({ type: 'success', title: 'Usuario creado' })
                                        } else {
                                            if (!editingId) throw new Error('Falta usuario a editar.')
                                            const payload: Parameters<typeof apiUpdateUsuario>[1] = {
                                                nombres: formNombres.trim(),
                                                apellidos: formApellidos.trim(),
                                                correo: formCorreo.trim(),
                                                id_rol: formIdRol,
                                                estado: formEstado,
                                                email_verificado_en: formEmailVerificadoEn,
                                            }
                                            if (formPassword.trim().length > 0) payload.password = formPassword
                                            const updated = await apiUpdateUsuario(editingId, payload)
                                            setUsuarios((prev) => prev.map((x) => (x.id_usuario === updated.id_usuario ? updated : x)))
                                            pushToast({ type: 'success', title: 'Cambios guardados' })
                                        }
                                        setModalOpen(false)
                                    } catch (err: unknown) {
                                        pushToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(err) })
                                    } finally {
                                        setSaving(false)
                                    }
                                }}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {confirm.open ? (
                <div className="fixed inset-0 z-[55]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/40"
                        aria-label="Cerrar"
                        onClick={() => (saving ? null : setConfirm({ open: false }))}
                    />
                    <div className="absolute left-1/2 top-24 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className={confirm.tone === 'danger' ? 'text-rose-700' : 'text-slate-900'}>
                                <i className={`bi ${confirm.tone === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'}`} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base font-semibold text-slate-900">{confirm.title}</div>
                                <div className="mt-1 text-sm text-slate-600">{confirm.message}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                disabled={saving}
                                onClick={() => setConfirm({ open: false })}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={
                                    confirm.tone === 'danger'
                                        ? 'rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60'
                                        : 'rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60'
                                }
                                disabled={saving}
                                onClick={async () => {
                                    setSaving(true)
                                    try {
                                        await confirm.onConfirm()
                                        setConfirm({ open: false })
                                    } catch (err: unknown) {
                                        pushToast({ type: 'error', title: 'No se pudo completar', message: getErrorMessage(err) })
                                        setConfirm({ open: false })
                                    } finally {
                                        setSaving(false)
                                    }
                                }}
                            >
                                {saving ? 'Procesando...' : confirm.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}

function StatCard(props: { label: string; value: number; icon: string; tone: 'slate' | 'emerald' | 'amber' | 'rose' | 'indigo' }) {
    const tone = statTone(props.tone)
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.bg} ${tone.text}`}>
                    <i className={`bi ${props.icon}`} aria-hidden="true" />
                </div>
            </div>
        </div>
    )
}

function statTone(tone: 'slate' | 'emerald' | 'amber' | 'rose' | 'indigo') {
    if (tone === 'emerald') return { bg: 'bg-emerald-50', text: 'text-emerald-800' }
    if (tone === 'amber') return { bg: 'bg-amber-50', text: 'text-amber-800' }
    if (tone === 'rose') return { bg: 'bg-rose-50', text: 'text-rose-800' }
    if (tone === 'indigo') return { bg: 'bg-indigo-50', text: 'text-indigo-800' }
    return { bg: 'bg-slate-100', text: 'text-slate-700' }
}

function roleBadge(rol: Usuario['rol']) {
    if (rol === 'administrador') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800">
                <i className="bi bi-stars" aria-hidden="true" />
                Administrador
            </span>
        )
    }
    if (rol === 'editor') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800">
                <i className="bi bi-pencil-square" aria-hidden="true" />
                Editor
            </span>
        )
    }
    if (rol === 'visor') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                <i className="bi bi-eye" aria-hidden="true" />
                Visor
            </span>
        )
    }

    const label = rol
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase())

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
            <i className="bi bi-shield" aria-hidden="true" />
            {label || rol}
        </span>
    )
}

function estadoBadge(estado: Usuario['estado']) {
    if (estado === 'activo') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                <i className="bi bi-check-circle" aria-hidden="true" />
                Activo
            </span>
        )
    }
    if (estado === 'suspendido') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                <i className="bi bi-slash-circle" aria-hidden="true" />
                Suspendido
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
            <i className="bi bi-pause-circle" aria-hidden="true" />
            Inactivo
        </span>
    )
}

function toastClass(type: ToastType) {
    if (type === 'success') return 'pointer-events-auto rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-white shadow-lg'
    if (type === 'error') return 'pointer-events-auto rounded-2xl border border-rose-200 bg-rose-600 px-4 py-3 text-white shadow-lg'
    return 'pointer-events-auto rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-lg'
}

function toastIcon(type: ToastType) {
    if (type === 'success') return 'bi bi-check-circle'
    if (type === 'error') return 'bi bi-exclamation-triangle'
    return 'bi bi-info-circle'
}

function initials(nombres: string) {
    const parts = nombres
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
    if (parts.length === 0) return 'U'
    return parts.map((p) => p[0]!.toUpperCase()).join('')
}

function isProbablyEmail(value: string) {
    const v = value.trim()
    if (v.length < 3) return false
    if (!v.includes('@')) return false
    const [a, b] = v.split('@')
    if (!a || !b) return false
    if (!b.includes('.')) return false
    return true
}

function generatePassword() {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%*?'
    let out = ''
    for (let i = 0; i < 12; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return out
}

function formatDate(dateString: string) {
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return dateString
    return d.toLocaleString()
}

function getErrorMessage(err: unknown) {
    if (err instanceof ApiError) {
        const maybeJson = safeJsonParse(err.bodyText)
        if (maybeJson && typeof maybeJson === 'object' && 'message' in maybeJson) {
            const message = (maybeJson as { message?: unknown }).message
            if (typeof message === 'string' && message.trim().length > 0) return message
        }
        return `No se pudo completar la acción. (${err.status})`
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
