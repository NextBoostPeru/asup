import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section>
      <h1>No encontrado</h1>
      <p>La ruta no existe.</p>
      <Link to="/">Volver</Link>
    </section>
  )
}
