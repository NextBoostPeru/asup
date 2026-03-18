import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, apiVerifyEmail } from '../lib/api'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    async function run() {
      if (!token) {
        setError('Falta el token de verificación.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        await apiVerifyEmail(token)
        setOk(true)
      } catch (err: unknown) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [token])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500">ASUP</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Verificar correo</h1>
        </div>

        {loading ? <p className="text-sm text-slate-600">Verificando...</p> : null}

        {!loading && ok ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Correo verificado. Ya puedes iniciar sesión.
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mt-4">
          <Link className="text-sm font-medium text-slate-900 underline underline-offset-4" to="/login">
            Ir a login
          </Link>
        </div>
      </section>
    </div>
  )
}

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    const maybeJson = safeJsonParse(err.bodyText)
    if (maybeJson && typeof maybeJson === 'object' && 'message' in maybeJson) {
      const message = (maybeJson as { message?: unknown }).message
      if (typeof message === 'string' && message.trim().length > 0) return message
    }
    return `No se pudo verificar el correo. (${err.status})`
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

