<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $usuario = $request->user();
        if (! $usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if (! in_array($usuario->rol, $roles, true)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return $next($request);
    }
}
