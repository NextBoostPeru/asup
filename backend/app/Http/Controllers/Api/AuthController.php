<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:200'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $usuario = Usuario::create([
            'nombres' => $data['nombres'],
            'correo' => $data['correo'],
            'password' => Hash::make($data['password']),
            'rol' => 'visor',
            'estado' => 'activo',
        ]);

        [$token, $tokenRecord] = $this->issueToken($usuario, 'register');

        return response()->json([
            'token' => $token,
            'usuario' => $usuario,
            'token_id' => $tokenRecord->getKey(),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'correo' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string'],
        ]);

        $usuario = Usuario::query()->where('correo', $data['correo'])->first();

        if (!$usuario || !Hash::check($data['password'], $usuario->password)) {
            return response()->json([
                'message' => 'Credenciales inválidas.',
            ], 422);
        }

        if ($usuario->estado !== 'activo') {
            return response()->json([
                'message' => 'El usuario no está activo.',
            ], 403);
        }

        $usuario->forceFill(['ultimo_acceso' => now()])->save();

        [$token, $tokenRecord] = $this->issueToken($usuario, 'login');

        return response()->json([
            'token' => $token,
            'usuario' => $usuario,
            'token_id' => $tokenRecord->getKey(),
        ]);
    }

    public function me(Request $request)
    {
        $usuario = $this->resolveUsuarioFromBearerToken($request);

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        return response()->json(['usuario' => $usuario]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $hash = hash('sha256', $token);
        ApiToken::query()->where('token_hash', $hash)->delete();

        return response()->json(['ok' => true]);
    }

    private function issueToken(Usuario $usuario, string $nombre)
    {
        $token = Str::random(80);

        $tokenRecord = ApiToken::create([
            'id_usuario' => $usuario->getKey(),
            'token_hash' => hash('sha256', $token),
            'nombre' => $nombre,
        ]);

        return [$token, $tokenRecord];
    }

    private function resolveUsuarioFromBearerToken(Request $request): ?Usuario
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        $hash = hash('sha256', $token);

        $tokenRecord = ApiToken::query()->where('token_hash', $hash)->first();
        if (!$tokenRecord) {
            return null;
        }

        $tokenRecord->forceFill(['ultimo_uso' => now()])->save();

        return $tokenRecord->usuario;
    }
}
