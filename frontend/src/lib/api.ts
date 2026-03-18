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
  correo: string
  rol: 'administrador' | 'editor' | 'visor'
  estado: 'activo' | 'inactivo' | 'suspendido'
  fecha_creacion: string
  fecha_actualizacion: string | null
  ultimo_acceso: string | null
}

export type AuthResponse = {
  token: string
  usuario: Usuario
  token_id: number
}

export type RegisterInput = {
  nombres: string
  correo: string
  password: string
}

export function apiRegister(input: RegisterInput) {
  return apiRequest<AuthResponse>('/auth/register', {
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
  return apiRequest<{ usuario: Usuario }>('/auth/me')
}

export function apiLogout() {
  return apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' })
}
