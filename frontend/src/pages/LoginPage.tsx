import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiLogin, getAuthToken, setAuthToken } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    const emailOk = correo.trim().length > 0
    const passwordOk = password.length > 0
    return emailOk && passwordOk && !submitting
  }, [correo, password, submitting])

  useEffect(() => {
    if (getAuthToken()) navigate('/', { replace: true })
  }, [navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await apiLogin({ correo: correo.trim(), password })
      setAuthToken(res.token)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <section
        className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="Login"
      >
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500">ASUP</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Bienvenido</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresa con tu correo y contraseña.</p>
        </div>

        {error ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-800" htmlFor="correo">
              Correo
            </label>
            <input
              id="correo"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-800" htmlFor="password">
                Contraseña
              </label>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <button
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link className="font-medium text-slate-900 underline underline-offset-4" to="/register">
              Crear cuenta
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    const maybeJson = safeJsonParse(err.bodyText)
    if (maybeJson && typeof maybeJson === 'object' && 'message' in maybeJson) {
      const message = (maybeJson as { message?: unknown }).message
      if (typeof message === 'string' && message.trim().length > 0) {
        if (message.includes('api_tokens') && message.includes("doesn't exist")) {
          return 'El backend no está listo: falta ejecutar migraciones (tabla api_tokens).'
        }
        return message
      }
    }
    return `No se pudo iniciar sesión. (${err.status})`
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
