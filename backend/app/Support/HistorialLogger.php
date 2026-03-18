<?php

namespace App\Support;

use App\Models\Historial;

class HistorialLogger
{
    public static function log(?int $idUsuario, string $accion, string $tabla, ?string $idRegistro, ?string $descripcion, ?array $antes, ?array $despues): void
    {
        Historial::create([
            'id_usuario' => $idUsuario,
            'accion' => $accion,
            'tabla_afectada' => $tabla,
            'id_registro_afectado' => $idRegistro,
            'descripcion' => $descripcion,
            'valores_antes' => $antes,
            'valores_despues' => $despues,
            'fecha' => now(),
        ]);
    }
}
