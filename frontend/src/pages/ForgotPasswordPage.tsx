import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiForgotPassword } from '../lib/api'

export function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const canSubmit = useMemo(() => correo.trim().length > 0 && !submitting, [correo, submitting])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500">ASUP</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-600">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {info}
          </div>
        ) : null}

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit) return
            setSubmitting(true)
            setError(null)
            setInfo(null)
            try {
              await apiForgotPassword(correo.trim())
              setInfo('Si el correo existe, se envió un enlace de recuperación.')
            } catch (err: unknown) {
              setError(getErrorMessage(err))
            } finally {
              setSubmitting(false)
            }
          }}
        >
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

          <button
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? 'Enviando...' : 'Enviar enlace'}
          </button>

          <p className="text-sm text-slate-600">
            <Link className="font-medium text-slate-900 underline underline-offset-4" to="/login">
              Volver a login
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    return `No se pudo enviar el enlace. (${err.status})`
  }
  if (err instanceof Error && err.message.trim().length > 0) return err.message
  return 'Ocurrió un error inesperado.'
}

