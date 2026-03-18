<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Acta;
use Illuminate\Http\Request;

class ActaController extends Controller
{
    public function index(Request $request)
    {
        $query = Acta::query();

        if ($request->filled('id_reunion')) {
            $query->where('id_reunion', $request->integer('id_reunion'));
        }

        return response()->json($query->orderByDesc('fecha_subida')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_reunion' => ['required', 'integer', 'exists:reuniones,id_reunion'],
            'nombre_archivo' => ['required', 'string', 'max:255'],
            'tipo_archivo' => ['required', 'string', 'max:100'],
            'ruta_archivo' => ['required', 'string'],
            'hash_sha256' => ['nullable', 'string', 'size:64'],
        ]);

        $acta = Acta::create($data);

        return response()->json($acta, 201);
    }

    public function show(Acta $acta)
    {
        return response()->json($acta->load('reunion'));
    }

    public function update(Request $request, Acta $acta)
    {
        $data = $request->validate([
            'id_reunion' => ['sometimes', 'required', 'integer', 'exists:reuniones,id_reunion'],
            'nombre_archivo' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo_archivo' => ['sometimes', 'required', 'string', 'max:100'],
            'ruta_archivo' => ['sometimes', 'required', 'string'],
            'hash_sha256' => ['sometimes', 'nullable', 'string', 'size:64'],
        ]);

        $acta->fill($data)->save();

        return response()->json($acta);
    }

    public function destroy(Acta $acta)
    {
        $acta->delete();

        return response()->json(null, 204);
    }
}
