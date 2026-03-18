<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $hash = hash('sha256', $token);
        $tokenRecord = ApiToken::query()->where('token_hash', $hash)->first();
        if (! $tokenRecord) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($tokenRecord->expira_en && $tokenRecord->expira_en->isPast()) {
            $tokenRecord->delete();

            return response()->json(['message' => 'Sesión expirada.'], 401);
        }

        $tokenRecord->forceFill(['ultimo_uso' => now()])->save();
        $usuario = $tokenRecord->usuario;
        if (! $usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($usuario->estado !== 'activo') {
            $tokenRecord->delete();

            return response()->json(['message' => 'Sesión inválida.'], 401);
        }

        if ((bool) env('ASUP_REQUIRE_EMAIL_VERIFICATION', false) && ! $usuario->email_verificado_en) {
            $tokenRecord->delete();

            return response()->json(['message' => 'Sesión inválida.'], 401);
        }

        $request->setUserResolver(fn () => $usuario);
        Auth::setUser($usuario);

        return $next($request);
    }
}
