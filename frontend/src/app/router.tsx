import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'
import { AppLayout } from '../layouts/AppLayout'
import { AlertasPage } from '../pages/AlertasPage'
import { DashboardPage } from '../pages/DashboardPage'
import { InstitucionesPage } from '../pages/InstitucionesPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReunionesPage } from '../pages/ReunionesPage'
import { RepresentantesPage } from '../pages/RepresentantesPage'
import { UsuariosPage } from '../pages/UsuariosPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'instituciones', element: <InstitucionesPage /> },
      { path: 'representantes', element: <RepresentantesPage /> },
      { path: 'reuniones', element: <ReunionesPage /> },
      { path: 'alertas', element: <AlertasPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
