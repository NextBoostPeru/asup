import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'
import { RequirePermission } from './RequirePermission'
import { AppLayout } from '../layouts/AppLayout'
import { AlertasPage } from '../pages/AlertasPage'
import { DashboardPage } from '../pages/DashboardPage'
import { InstitucionesPage } from '../pages/InstitucionesPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReunionesPage } from '../pages/ReunionesPage'
import { RepresentantesPage } from '../pages/RepresentantesPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { RolesPage } from '../pages/RolesPage'
import { UsuariosPage } from '../pages/UsuariosPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'

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
      {
        path: 'instituciones',
        element: (
          <RequirePermission modulo="instituciones">
            <InstitucionesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'representantes',
        element: (
          <RequirePermission modulo="representantes">
            <RepresentantesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'reuniones',
        element: (
          <RequirePermission modulo="reuniones">
            <ReunionesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'alertas',
        element: (
          <RequirePermission modulo="alertas">
            <AlertasPage />
          </RequirePermission>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <RequirePermission modulo="usuarios">
            <UsuariosPage />
          </RequirePermission>
        ),
      },
      {
        path: 'roles',
        element: (
          <RequirePermission modulo="roles">
            <RolesPage />
          </RequirePermission>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
