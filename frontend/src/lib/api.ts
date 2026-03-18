export class ApiError extends Error {
  status: number
  url: string
  bodyText?: string

  constructor(message: string, status: number, url: string, bodyText?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    this.bodyText = bodyText
  }
}

const DEFAULT_API_BASE_URL = 'https://apiasup.nextboostperu.com/public/api'
const AUTH_TOKEN_STORAGE_KEY = 'asup_auth_token'

export function getApiBaseUrl() {
  const envBase = import.meta.env.VITE_API_BASE_URL
  if (typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/+$/, '')
  }

  return DEFAULT_API_BASE_URL
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function getAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  return token && token.trim().length > 0 ? token : null
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const url = joinUrl(getApiBaseUrl(), path)
  const token = getAuthToken()
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => undefined)
    if (res.status === 401) {
      clearAuthToken()
      window.dispatchEvent(new CustomEvent('asup:unauthorized'))
    }
    throw new ApiError(`API request failed (${res.status})`, res.status, url, bodyText)
  }

  return (await res.json()) as TResponse
}

export type HealthResponse = { status: string }

export function apiHealth() {
  return apiRequest<HealthResponse>('/health')
}

export type Sector = {
  id_sector: number
  nombre_sector: string
  estado: 'activo' | 'inactivo'
  fecha_creacion: string
  fecha_actualizacion: string | null
}

export function apiListSectores() {
  return apiRequest<Sector[]>('/sectores')
}

export type Usuario = {
  id_usuario: number
  nombres: string
  apellidos: string | null
  correo: string
  rol: string
  id_rol: number | null
  estado: 'activo' | 'inactivo' | 'suspendido'
  email_verificado_en: string | null
  fecha_creacion: string
  fecha_actualizacion: string | null
  ultimo_acceso: string | null
}

export type AuthResponse = {
  token: string
  usuario: Usuario
  token_id: number
}

export type RegisterResponse =
  | AuthResponse
  | {
      verification_required: true
      token?: string
    }

export type RegisterInput = {
  nombres: string
  apellidos: string
  correo: string
  password: string
}

export function apiRegister(input: RegisterInput) {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export type LoginInput = {
  correo: string
  password: string
}

export function apiLogin(input: LoginInput) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function apiMe() {
  return apiRequest<{ usuario: Usuario; permisos?: PermisosPorModulo }>('/auth/me')
}

export function apiLogout() {
  return apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' })
}

export function apiResendVerification(correo: string) {
  return apiRequest<{ ok: true; token?: string }>('/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  })
}

export function apiVerifyEmail(token: string) {
  const qs = new URLSearchParams({ token })
  return apiRequest<{ ok: true }>(`/auth/verify-email?${qs.toString()}`)
}

export function apiForgotPassword(correo: string) {
  return apiRequest<{ ok: true; token?: string }>('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  })
}

export function apiResetPassword(token: string, password: string) {
  return apiRequest<{ ok: true }>('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
}

export type UsuarioCreateInput = {
  nombres: string
  apellidos: string
  correo: string
  password: string
  rol?: Usuario['rol']
  id_rol?: number | null
  estado?: Usuario['estado']
}

export type UsuarioUpdateInput = Partial<
  Pick<Usuario, 'nombres' | 'apellidos' | 'correo' | 'rol' | 'estado' | 'ultimo_acceso'>
> & {
  password?: string
  email_verificado_en?: string | null
  id_rol?: number | null
}

export function apiListUsuarios(params?: { estado?: Usuario['estado']; rol?: Usuario['rol'] }) {
  const qs = new URLSearchParams()
  if (params?.estado) qs.set('estado', params.estado)
  if (params?.rol) qs.set('rol', params.rol)
  const suffix = qs.toString().length > 0 ? `?${qs.toString()}` : ''
  return apiRequest<Usuario[]>(`/usuarios${suffix}`)
}

export function apiCreateUsuario(input: UsuarioCreateInput) {
  return apiRequest<Usuario>('/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function apiUpdateUsuario(id_usuario: number, input: UsuarioUpdateInput) {
  return apiRequest<Usuario>(`/usuarios/${id_usuario}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function apiDeactivateUsuario(id_usuario: number) {
  return apiRequest<Usuario>(`/usuarios/${id_usuario}`, { method: 'DELETE' })
}

export type PermisosPorModulo = Record<
  string,
  { ver: boolean; agregar: boolean; editar: boolean; eliminar: boolean }
>

export type RbacModulo = { key: string; label: string }

export function apiRbacModulos() {
  return apiRequest<{ modulos: RbacModulo[]; acciones: Array<'ver' | 'agregar' | 'editar' | 'eliminar'> }>(
    '/rbac/modulos',
  )
}

export function apiMisPermisos() {
  return apiRequest<{ permisos: PermisosPorModulo }>('/rbac/mis-permisos')
}

export type RolModuloPermiso = {
  id_rol: number
  modulo: string
  puede_ver: boolean
  puede_agregar: boolean
  puede_editar: boolean
  puede_eliminar: boolean
}

export type Rol = {
  id_rol: number
  nombre: string
  slug: string
  descripcion: string | null
  es_sistema: boolean
  fecha_creacion: string
  fecha_actualizacion: string | null
  modulo_permisos?: RolModuloPermiso[]
}

export type RolOption = { id_rol: number; nombre: string; slug: string; es_sistema: boolean }

export function apiRbacRoles() {
  return apiRequest<{ roles: RolOption[] }>('/rbac/roles')
}

export type RolPermisosInput = Array<{
  modulo: string
  puede_ver?: boolean
  puede_agregar?: boolean
  puede_editar?: boolean
  puede_eliminar?: boolean
}>

export type RolCreateInput = {
  nombre: string
  slug?: string | null
  descripcion?: string | null
  permisos: RolPermisosInput
}

export type RolUpdateInput = Partial<Omit<RolCreateInput, 'permisos'>> & {
  permisos?: RolPermisosInput
}

export function apiListRoles() {
  return apiRequest<Rol[]>('/roles')
}

export function apiCreateRol(input: RolCreateInput) {
  return apiRequest<Rol>('/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function apiUpdateRol(id_rol: number, input: RolUpdateInput) {
  return apiRequest<Rol>(`/roles/${id_rol}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function apiDeleteRol(id_rol: number) {
  return apiRequest<null>(`/roles/${id_rol}`, { method: 'DELETE' })
}
