import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiRegister, getAuthToken, setAuthToken } from '../lib/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const passwordsMatch = password.length > 0 && password === confirmPassword

  const canSubmit = useMemo(() => {
    const nombresOk = nombres.trim().length >= 3
    const apellidosOk = apellidos.trim().length >= 3
    const emailOk = correo.trim().length > 0
    const passwordOk = password.length >= 8
    const confirmOk = confirmPassword.length > 0
    return nombresOk && apellidosOk && emailOk && passwordOk && confirmOk && passwordsMatch && !submitting
  }, [nombres, apellidos, correo, password, confirmPassword, passwordsMatch, submitting])

  useEffect(() => {
    if (getAuthToken()) navigate('/', { replace: true })
  }, [navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    setInfo(null)

    try {
      const res = await apiRegister({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
        password,
      })
      if ('token' in res && typeof res.token === 'string') {
        setAuthToken(res.token)
        navigate('/', { replace: true })
        return
      }

      if ('verification_required' in res && res.verification_required) {
        setInfo('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.')
        navigate('/login', { replace: true })
        return
      }

      setError('No se pudo completar el registro.')
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
        aria-label="Registro"
      >
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500">ASUP</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-600">Configura tu acceso para empezar.</p>
        </div>

        {error ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {info}
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-800" htmlFor="nombres">
                Nombres
              </label>
              <input
                id="nombres"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                type="text"
                autoComplete="given-name"
                placeholder="Tus nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-800" htmlFor="apellidos">
                Apellidos
              </label>
              <input
                id="apellidos"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
                type="text"
                autoComplete="family-name"
                placeholder="Tus apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              minLength={8}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-800" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {!passwordsMatch && confirmPassword.length > 0 ? (
            <p className="text-sm text-red-700">Las contraseñas no coinciden.</p>
          ) : (
            <p className="text-sm text-slate-600">Usa una contraseña segura (mínimo 8 caracteres).</p>
          )}

          <button
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? 'Creando...' : 'Crear cuenta'}
          </button>

          <p className="text-sm text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link className="font-medium text-slate-900 underline underline-offset-4" to="/login">
              Ingresar
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
    return `No se pudo crear la cuenta. (${err.status})`
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
