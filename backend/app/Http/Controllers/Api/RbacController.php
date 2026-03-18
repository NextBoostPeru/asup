<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Support\Rbac;
use Illuminate\Http\Request;

class RbacController extends Controller
{
    public function modulos()
    {
        return response()->json([
            'modulos' => Rbac::modulos(),
            'acciones' => ['ver', 'agregar', 'editar', 'eliminar'],
        ]);
    }

    public function misPermisos(Request $request)
    {
        $usuario = $request->user();
        if (! $usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        return response()->json([
            'permisos' => Rbac::permisosDeUsuario($usuario),
        ]);
    }

    public function roles()
    {
        return response()->json([
            'roles' => Rol::query()
                ->orderBy('nombre')
                ->get(['id_rol', 'nombre', 'slug', 'es_sistema']),
        ]);
    }
}
