import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiLogin, apiResendVerification, getAuthToken, setAuthToken } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

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
    setInfo(null)

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

  const mustVerifyEmail = Boolean(error && error.toLowerCase().includes('confirmar tu correo'))

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-10">
        <aside className="relative md:col-span-7">
          <img
            src="/hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/10" />
        </aside>

        <main className="flex items-center justify-center bg-slate-50 px-4 py-10 md:col-span-3 md:px-8">
          <section className="w-full max-w-md" aria-label="Login">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <div className="text-xs font-semibold tracking-wide text-slate-500">Acceso</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Bienvenido</h2>
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

              {info ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {info}
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

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <Link className="text-slate-700 underline underline-offset-4" to="/forgot-password">
                    ¿Olvidaste tu contraseña?
                  </Link>

                  {mustVerifyEmail ? (
                    <button
                      type="button"
                      className="text-slate-900 underline underline-offset-4 disabled:opacity-60"
                      disabled={resending || correo.trim().length === 0}
                      onClick={async () => {
                        setResending(true)
                        setInfo(null)
                        setError(null)
                        try {
                          await apiResendVerification(correo.trim())
                          setInfo('Se envió el correo de verificación si la cuenta existe.')
                        } catch (e: unknown) {
                          setError(getErrorMessage(e))
                        } finally {
                          setResending(false)
                        }
                      }}
                    >
                      {resending ? 'Reenviando...' : 'Reenviar verificación'}
                    </button>
                  ) : null}
                </div>

                <p className="text-sm text-slate-600">
                  ¿No tienes cuenta?{' '}
                  <Link className="font-medium text-slate-900 underline underline-offset-4" to="/register">
                    Crear cuenta
                  </Link>
                </p>
              </form>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} ASUP
            </p>
          </section>
        </main>
      </div>
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
