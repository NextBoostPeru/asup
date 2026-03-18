<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerta;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function index(Request $request)
    {
        $query = Alerta::query()->with('representante');

        if ($request->filled('id_representante')) {
            $query->where('id_representante', $request->integer('id_representante'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('tipo_alerta')) {
            $query->where('tipo_alerta', $request->string('tipo_alerta'));
        }

        return response()->json($query->orderByDesc('fecha_generada')->get());
    }

    public function show(Alerta $alerta)
    {
        return response()->json($alerta->load('representante'));
    }

    public function update(Request $request, Alerta $alerta)
    {
        $data = $request->validate([
            'estado' => ['sometimes', 'required', 'in:pendiente,leida'],
        ]);

        $nuevoEstado = $data['estado'] ?? null;
        if ($nuevoEstado !== null) {
            $alerta->estado = $nuevoEstado;
            if ($nuevoEstado === 'leida' && $alerta->fecha_leida === null) {
                $alerta->fecha_leida = now();
            }
            if ($nuevoEstado === 'pendiente') {
                $alerta->fecha_leida = null;
            }
        }

        $alerta->save();

        return response()->json($alerta);
    }
}
