<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\EmailVerificationToken;
use App\Models\PasswordRecoveryRequest;
use App\Models\Usuario;
use App\Notifications\PasswordRecoveryNotification;
use App\Notifications\VerifyEmailNotification;
use App\Support\HistorialLogger;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:200'],
            'apellidos' => ['required', 'string', 'max:200'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $requireVerification = $this->requireEmailVerification();
        $idRolVisor = null;
        try {
            $idRolVisor = DB::table('roles')->where('slug', 'visor')->value('id_rol');
        } catch (\Throwable) {
            $idRolVisor = null;
        }

        $usuario = Usuario::create([
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
            'correo' => $data['correo'],
            'password' => Hash::make($data['password']),
            'rol' => 'visor',
            'id_rol' => $idRolVisor ? (int) $idRolVisor : null,
            'estado' => $requireVerification ? 'inactivo' : 'activo',
        ]);

        HistorialLogger::log($usuario->getKey(), 'usuario_creado', 'usuarios', (string) $usuario->getKey(), 'Registro de usuario', null, $usuario->toArray());

        if ($requireVerification) {
            $token = $this->issueEmailVerificationToken($usuario, $request);
            $this->sendEmailVerification($usuario, $token, $request);

            $response = [
                'verification_required' => true,
            ];
            if (config('app.debug')) {
                $response['token'] = $token;
            }

            return response()->json($response, 201);
        }

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

        if (! $usuario || ! Hash::check($data['password'], $usuario->password)) {
            return response()->json([
                'message' => 'Credenciales inválidas.',
            ], 422);
        }

        if ($this->requireEmailVerification() && ! $usuario->email_verificado_en) {
            return response()->json([
                'message' => 'Debes confirmar tu correo antes de iniciar sesión.',
            ], 403);
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
        $usuario = $request->user();
        if (! $usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        return response()->json([
            'usuario' => $usuario,
            'permisos' => Rbac::permisosDeUsuario($usuario),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $hash = hash('sha256', $token);
        ApiToken::query()->where('token_hash', $hash)->delete();

        return response()->json(['ok' => true]);
    }

    public function verifyEmail(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $hash = hash('sha256', $data['token']);

        $record = EmailVerificationToken::query()
            ->where('token_hash', $hash)
            ->whereNull('usado_en')
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Token inválido.'], 422);
        }

        if ($record->expira_en && $record->expira_en->isPast()) {
            return response()->json(['message' => 'Token expirado.'], 422);
        }

        $usuario = $record->usuario;
        if (! $usuario) {
            return response()->json(['message' => 'Token inválido.'], 422);
        }

        $record->forceFill(['usado_en' => now()])->save();

        $antes = $usuario->toArray();
        $usuario->forceFill([
            'email_verificado_en' => now(),
            'estado' => 'activo',
        ])->save();

        HistorialLogger::log($usuario->getKey(), 'email_verificado', 'usuarios', (string) $usuario->getKey(), 'Confirmación de correo', $antes, $usuario->toArray());

        return response()->json(['ok' => true]);
    }

    public function resendVerification(Request $request)
    {
        $data = $request->validate([
            'correo' => ['required', 'email', 'max:150'],
        ]);

        $usuario = Usuario::query()->where('correo', $data['correo'])->first();
        if (! $usuario) {
            return response()->json(['ok' => true]);
        }

        if ($usuario->email_verificado_en) {
            return response()->json(['ok' => true]);
        }

        $token = $this->issueEmailVerificationToken($usuario, $request);
        $this->sendEmailVerification($usuario, $token, $request);

        HistorialLogger::log($usuario->getKey(), 'email_verificacion_reenviada', 'usuarios', (string) $usuario->getKey(), 'Reenvío de verificación', null, null);

        $response = ['ok' => true];
        if (config('app.debug')) {
            $response['token'] = $token;
        }

        return response()->json($response);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'correo' => ['required', 'email', 'max:150'],
        ]);

        $usuario = Usuario::query()->where('correo', $data['correo'])->first();

        $token = Str::random(80);
        $hash = hash('sha256', $token);

        PasswordRecoveryRequest::create([
            'id_usuario' => $usuario?->getKey(),
            'correo' => $data['correo'],
            'token_hash' => $hash,
            'expira_en' => now()->addMinutes($this->passwordRecoveryExpiresMinutes()),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 4000),
        ]);

        if ($usuario) {
            $this->sendPasswordRecovery($usuario, $token, $request);
        }

        HistorialLogger::log($usuario?->getKey(), 'password_recovery_solicitada', 'usuarios', $usuario ? (string) $usuario->getKey() : null, 'Solicitud de recuperación', null, null);

        $response = ['ok' => true];
        if (config('app.debug')) {
            $response['token'] = $token;
        }

        return response()->json($response);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $hash = hash('sha256', $data['token']);

        $record = PasswordRecoveryRequest::query()
            ->where('token_hash', $hash)
            ->whereNull('usado_en')
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Token inválido.'], 422);
        }

        if ($record->expira_en && $record->expira_en->isPast()) {
            return response()->json(['message' => 'Token expirado.'], 422);
        }

        $usuario = $record->usuario;
        if (! $usuario) {
            return response()->json(['message' => 'Token inválido.'], 422);
        }

        $antes = $usuario->toArray();
        $usuario->forceFill(['password' => Hash::make($data['password'])])->save();
        $record->forceFill(['usado_en' => now()])->save();

        HistorialLogger::log($usuario->getKey(), 'password_restablecida', 'usuarios', (string) $usuario->getKey(), 'Restablecimiento de contraseña', $antes, $usuario->toArray());

        return response()->json(['ok' => true]);
    }

    public function resetPasswordInfo(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $hash = hash('sha256', $data['token']);

        $record = PasswordRecoveryRequest::query()
            ->where('token_hash', $hash)
            ->whereNull('usado_en')
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Token inválido.'], 422);
        }

        if ($record->expira_en && $record->expira_en->isPast()) {
            return response()->json(['message' => 'Token expirado.'], 422);
        }

        return response()->json(['ok' => true]);
    }

    private function issueToken(Usuario $usuario, string $nombre)
    {
        $token = Str::random(80);

        if ((bool) env('ASUP_SINGLE_SESSION', true)) {
            ApiToken::query()->where('id_usuario', $usuario->getKey())->delete();
        }

        $tokenRecord = ApiToken::create([
            'id_usuario' => $usuario->getKey(),
            'token_hash' => hash('sha256', $token),
            'nombre' => $nombre,
            'expira_en' => now()->addMinutes($this->apiTokenExpiresMinutes()),
        ]);

        return [$token, $tokenRecord];
    }

    private function apiTokenExpiresMinutes(): int
    {
        return (int) env('ASUP_API_TOKEN_EXPIRES_MINUTES', 720);
    }

    private function requireEmailVerification(): bool
    {
        return (bool) env('ASUP_REQUIRE_EMAIL_VERIFICATION', false);
    }

    private function emailVerificationExpiresMinutes(): int
    {
        return (int) env('ASUP_EMAIL_VERIFICATION_EXPIRES_MINUTES', 60);
    }

    private function passwordRecoveryExpiresMinutes(): int
    {
        return (int) env('ASUP_PASSWORD_RECOVERY_EXPIRES_MINUTES', 60);
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

    private function sendPasswordRecovery(Usuario $usuario, string $token, Request $request): void
    {
        $frontendBase = $this->resolveFrontendBase($request);
        if ($frontendBase !== '') {
            $url = $frontendBase.'/reset-password?token='.urlencode($token);
            $usuario->notify(new PasswordRecoveryNotification($url, $this->passwordRecoveryExpiresMinutes()));

            return;
        }

        $apiBase = env('ASUP_API_PUBLIC_URL');
        if (! is_string($apiBase) || trim($apiBase) === '') {
            $apiBase = rtrim($request->getSchemeAndHttpHost(), '/').'/public/api';
        }

        $url = rtrim((string) $apiBase, '/').'/auth/reset-password?token='.urlencode($token);
        $usuario->notify(new PasswordRecoveryNotification($url, $this->passwordRecoveryExpiresMinutes()));
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
