<?php

namespace App\Http\Middleware;

use App\Support\Rbac;
use Closure;
use Illuminate\Http\Request;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string $modulo, ?string $accion = null)
    {
        $usuario = $request->user();
        if (! $usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $accionFinal = $accion ?: $this->inferAccion($request);
        if (! $accionFinal) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if (! Rbac::puede($usuario, $modulo, $accionFinal)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return $next($request);
    }

    private function inferAccion(Request $request): ?string
    {
        $method = strtoupper($request->method());

        return match ($method) {
            'GET', 'HEAD' => 'ver',
            'POST' => 'agregar',
            'PUT', 'PATCH' => 'editar',
            'DELETE' => 'eliminar',
            default => null,
        };
    }
}
