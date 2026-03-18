<?php

use App\Http\Controllers\Api\ActaController;
use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentoInstitucionController;
use App\Http\Controllers\Api\DocumentoRepresentanteController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\InstitucionController;
use App\Http\Controllers\Api\RbacController;
use App\Http\Controllers\Api\RepresentanteController;
use App\Http\Controllers\Api\ReunionController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\SectorController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::middleware('api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
        Route::get('reset-password', [AuthController::class, 'resetPasswordInfo']);
        Route::post('resend-verification', [AuthController::class, 'resendVerification'])->middleware('throttle:5,1');
        Route::get('verify-email', [AuthController::class, 'verifyEmail'])->middleware('throttle:20,1');
    });

    Route::middleware('auth.token')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });

        Route::get('rbac/modulos', [RbacController::class, 'modulos']);
        Route::get('rbac/mis-permisos', [RbacController::class, 'misPermisos']);
        Route::get('rbac/roles', [RbacController::class, 'roles']);

        Route::apiResource('sectores', SectorController::class)->parameters(['sectores' => 'sector'])->middleware('rbac:sectores');
        Route::apiResource('instituciones', InstitucionController::class)->parameters(['instituciones' => 'institucion'])->middleware('rbac:instituciones');
        Route::apiResource('representantes', RepresentanteController::class)->parameters(['representantes' => 'representante'])->middleware('rbac:representantes');
        Route::apiResource('reuniones', ReunionController::class)->parameters(['reuniones' => 'reunion'])->middleware('rbac:reuniones');
        Route::post('reuniones/{reunion}/representantes/sync', [ReunionController::class, 'syncRepresentantes'])->middleware('rbac:reuniones,editar');
        Route::apiResource('actas', ActaController::class)->parameters(['actas' => 'acta'])->middleware('rbac:actas');
        Route::apiResource('documentos-institucion', DocumentoInstitucionController::class)->parameters(['documentos-institucion' => 'documentoInstitucion'])->middleware('rbac:documentos-institucion');
        Route::apiResource('documentos-representante', DocumentoRepresentanteController::class)->parameters(['documentos-representante' => 'documentoRepresentante'])->middleware('rbac:documentos-representante');
        Route::apiResource('alertas', AlertaController::class)->parameters(['alertas' => 'alerta'])->only(['index', 'show', 'update'])->middleware('rbac:alertas');

        Route::apiResource('usuarios', UsuarioController::class)->parameters(['usuarios' => 'usuario'])->middleware('rbac:usuarios');
        Route::apiResource('historial', HistorialController::class)->parameters(['historial' => 'historialItem'])->only(['index', 'show'])->middleware('rbac:historial');
        Route::apiResource('roles', RolController::class)->parameters(['roles' => 'rol'])->middleware('rbac:roles');
    });
});
