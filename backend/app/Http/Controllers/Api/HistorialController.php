<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use Illuminate\Http\Request;

class HistorialController extends Controller
{
    public function index(Request $request)
    {
        $query = Historial::query()->with('usuario');

        if ($request->filled('id_usuario')) {
            $query->where('id_usuario', $request->integer('id_usuario'));
        }

        if ($request->filled('tabla_afectada')) {
            $query->where('tabla_afectada', $request->string('tabla_afectada'));
        }

        if ($request->filled('desde')) {
            $query->where('fecha', '>=', $request->string('desde'));
        }

        if ($request->filled('hasta')) {
            $query->where('fecha', '<=', $request->string('hasta'));
        }

        return response()->json($query->orderByDesc('fecha')->get());
    }

    public function show(Historial $historialItem)
    {
        return response()->json($historialItem->load('usuario'));
    }
}
