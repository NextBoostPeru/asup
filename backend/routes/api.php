<?php

use App\Http\Controllers\Api\ActaController;
use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentoInstitucionController;
use App\Http\Controllers\Api\DocumentoRepresentanteController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\InstitucionController;
use App\Http\Controllers\Api\ReunionController;
use App\Http\Controllers\Api\RepresentanteController;
use App\Http\Controllers\Api\SectorController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::middleware('api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::apiResource('sectores', SectorController::class)->parameters(['sectores' => 'sector']);
    Route::apiResource('instituciones', InstitucionController::class)->parameters(['instituciones' => 'institucion']);
    Route::apiResource('representantes', RepresentanteController::class)->parameters(['representantes' => 'representante']);
    Route::apiResource('reuniones', ReunionController::class)->parameters(['reuniones' => 'reunion']);
    Route::post('reuniones/{reunion}/representantes/sync', [ReunionController::class, 'syncRepresentantes']);
    Route::apiResource('actas', ActaController::class)->parameters(['actas' => 'acta']);
    Route::apiResource('documentos-institucion', DocumentoInstitucionController::class)->parameters(['documentos-institucion' => 'documentoInstitucion']);
    Route::apiResource('documentos-representante', DocumentoRepresentanteController::class)->parameters(['documentos-representante' => 'documentoRepresentante']);
    Route::apiResource('alertas', AlertaController::class)->parameters(['alertas' => 'alerta'])->only(['index', 'show', 'update']);
    Route::apiResource('usuarios', UsuarioController::class)->parameters(['usuarios' => 'usuario']);
    Route::apiResource('historial', HistorialController::class)->parameters(['historial' => 'historialItem'])->only(['index', 'show']);
});
