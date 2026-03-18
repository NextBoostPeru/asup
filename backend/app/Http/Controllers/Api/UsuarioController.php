<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationToken;
use App\Models\Rol;
use App\Models\Usuario;
use App\Notifications\VerifyEmailNotification;
use App\Support\HistorialLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $query = Usuario::query();

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('rol')) {
            $query->where('rol', $request->string('rol'));
        }

        return response()->json($query->orderBy('nombres')->orderBy('apellidos')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:200'],
            'apellidos' => ['required', 'string', 'max:200'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8'],
            'rol' => ['nullable', 'string', 'max:100'],
            'id_rol' => ['nullable', 'integer', 'exists:roles,id_rol'],
            'estado' => ['nullable', 'in:activo,inactivo,suspendido'],
        ]);

        $data['password'] = Hash::make($data['password']);
        if (array_key_exists('id_rol', $data) && $data['id_rol']) {
            $rol = Rol::query()->find((int) $data['id_rol']);
            if ($rol) {
                $data['rol'] = $rol->slug;
            }
        } else {
            $slug = (string) ($data['rol'] ?? 'visor');
            $rol = Rol::query()->where('slug', $slug)->first();
            if ($rol) {
                $data['id_rol'] = (int) $rol->getKey();
                $data['rol'] = $rol->slug;
            }
        }

        $usuario = Usuario::create($data);

        HistorialLogger::log(
            $request->user()?->getKey(),
            'usuario_creado',
            'usuarios',
            (string) $usuario->getKey(),
            'Creación de usuario por administrador',
            null,
            $usuario->toArray()
        );

        if (! $usuario->email_verificado_en) {
            if ($usuario->estado === 'activo') {
                $usuario->forceFill(['estado' => 'inactivo'])->save();
            }

            $token = $this->issueEmailVerificationToken($usuario, $request);
            $this->sendEmailVerification($usuario, $token, $request);

            HistorialLogger::log(
                $request->user()?->getKey(),
                'email_verificacion_enviada',
                'usuarios',
                (string) $usuario->getKey(),
                'Envío de verificación de correo (admin)',
                null,
                null
            );
        }

        return response()->json($usuario, 201);
    }

    public function show(Usuario $usuario)
    {
        return response()->json($usuario->load('historial'));
    }

    public function update(Request $request, Usuario $usuario)
    {
        $antes = $usuario->toArray();

        $data = $request->validate([
            'nombres' => ['sometimes', 'required', 'string', 'max:200'],
            'apellidos' => ['sometimes', 'required', 'string', 'max:200'],
            'correo' => ['sometimes', 'required', 'email', 'max:150', 'unique:usuarios,correo,'.$usuario->getKey().',id_usuario'],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'rol' => ['sometimes', 'nullable', 'string', 'max:100'],
            'id_rol' => ['sometimes', 'nullable', 'integer', 'exists:roles,id_rol'],
            'estado' => ['sometimes', 'nullable', 'in:activo,inactivo,suspendido'],
            'ultimo_acceso' => ['sometimes', 'nullable', 'date'],
            'email_verificado_en' => ['sometimes', 'nullable', 'date'],
        ]);

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }
        if (array_key_exists('id_rol', $data) && $data['id_rol']) {
            $rol = Rol::query()->find((int) $data['id_rol']);
            if ($rol) {
                $data['rol'] = $rol->slug;
            }
        } elseif (array_key_exists('rol', $data) && $data['rol']) {
            $rol = Rol::query()->where('slug', (string) $data['rol'])->first();
            if ($rol) {
                $data['id_rol'] = (int) $rol->getKey();
                $data['rol'] = $rol->slug;
            }
        }

        $usuario->fill($data)->save();

        HistorialLogger::log(
            $request->user()?->getKey(),
            'usuario_actualizado',
            'usuarios',
            (string) $usuario->getKey(),
            'Actualización de usuario',
            $antes,
            $usuario->toArray()
        );

        return response()->json($usuario);
    }

    public function destroy(Usuario $usuario)
    {
        $antes = $usuario->toArray();
        $usuario->forceFill(['estado' => 'inactivo'])->save();

        HistorialLogger::log(
            request()->user()?->getKey(),
            'usuario_desactivado',
            'usuarios',
            (string) $usuario->getKey(),
            'Desactivación de usuario',
            $antes,
            $usuario->toArray()
        );

        return response()->json($usuario);
    }

    private function emailVerificationExpiresMinutes(): int
    {
        return (int) env('ASUP_EMAIL_VERIFICATION_EXPIRES_MINUTES', 60);
    }

    private function issueEmailVerificationToken(Usuario $usuario, Request $request): string
    {
        $token = Str::random(80);

        EmailVerificationToken::create([
            'id_usuario' => $usuario->getKey(),
            'token_hash' => hash('sha256', $token),
            'expira_en' => now()->addMinutes($this->emailVerificationExpiresMinutes()),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 4000),
        ]);

        return $token;
    }

    private function sendEmailVerification(Usuario $usuario, string $token, Request $request): void
    {
        $frontendBase = $this->resolveFrontendBase($request);
        if ($frontendBase !== '') {
            $url = $frontendBase.'/verify-email?token='.urlencode($token);
            $usuario->notify(new VerifyEmailNotification($url, $this->emailVerificationExpiresMinutes()));

            return;
        }

        $apiBase = env('ASUP_API_PUBLIC_URL');
        if (! is_string($apiBase) || trim($apiBase) === '') {
            $apiBase = rtrim($request->getSchemeAndHttpHost(), '/').'/public/api';
        }

        $url = rtrim((string) $apiBase, '/').'/auth/verify-email?token='.urlencode($token);
        $usuario->notify(new VerifyEmailNotification($url, $this->emailVerificationExpiresMinutes()));
    }

    private function resolveFrontendBase(Request $request): string
    {
        $fromEnv = rtrim((string) env('ASUP_FRONTEND_URL', ''), '/');
        if ($fromEnv !== '') {
            return $fromEnv;
        }

        $origin = $request->headers->get('origin');
        if (is_string($origin)) {
            $origin = trim($origin);
            if ($origin !== '' && preg_match('#^https?://#i', $origin)) {
                return rtrim($origin, '/');
            }
        }

        $referer = $request->headers->get('referer');
        if (is_string($referer)) {
            $referer = trim($referer);
            if ($referer !== '' && preg_match('#^https?://#i', $referer)) {
                $parts = parse_url($referer);
                $scheme = is_array($parts) ? ($parts['scheme'] ?? null) : null;
                $host = is_array($parts) ? ($parts['host'] ?? null) : null;
                $port = is_array($parts) ? ($parts['port'] ?? null) : null;
                if (is_string($scheme) && is_string($host)) {
                    $base = $scheme.'://'.$host;
                    if (is_int($port)) {
                        $base .= ':'.$port;
                    }

                    return rtrim($base, '/');
                }
            }
        }

        return '';
    }
}
