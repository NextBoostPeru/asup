<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reunion;
use Illuminate\Http\Request;

class ReunionController extends Controller
{
    public function index(Request $request)
    {
        $query = Reunion::query();

        if ($request->filled('tipo_reunion')) {
            $query->where('tipo_reunion', $request->string('tipo_reunion'));
        }

        if ($request->filled('modalidad')) {
            $query->where('modalidad', $request->string('modalidad'));
        }

        if ($request->filled('desde')) {
            $query->whereDate('fecha', '>=', $request->string('desde'));
        }

        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->string('hasta'));
        }

        return response()->json($query->orderByDesc('fecha')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_reunion' => ['required', 'in:Consejo,Directorio'],
            'fecha' => ['required', 'date'],
            'hora' => ['nullable', 'date_format:H:i:s'],
            'modalidad' => ['required', 'in:Presencial,Virtual'],
            'lugar' => ['nullable', 'string', 'max:255'],
            'enlace' => ['nullable', 'string'],
            'frecuencia' => ['nullable', 'string', 'max:100'],
        ]);

        $reunion = Reunion::create($data);

        return response()->json($reunion, 201);
    }

    public function show(Reunion $reunion)
    {
        return response()->json($reunion->load(['actas', 'representantes']));
    }

    public function update(Request $request, Reunion $reunion)
    {
        $data = $request->validate([
            'tipo_reunion' => ['sometimes', 'required', 'in:Consejo,Directorio'],
            'fecha' => ['sometimes', 'required', 'date'],
            'hora' => ['sometimes', 'nullable', 'date_format:H:i:s'],
            'modalidad' => ['sometimes', 'required', 'in:Presencial,Virtual'],
            'lugar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'enlace' => ['sometimes', 'nullable', 'string'],
            'frecuencia' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $reunion->fill($data)->save();

        return response()->json($reunion);
    }

    public function destroy(Reunion $reunion)
    {
        $reunion->delete();

        return response()->json(null, 204);
    }

    public function syncRepresentantes(Request $request, Reunion $reunion)
    {
        $data = $request->validate([
            'representantes' => ['required', 'array', 'min:1'],
            'representantes.*.id_representante' => ['required', 'integer', 'exists:representantes,id_representante'],
            'representantes.*.rol_participacion' => ['nullable', 'in:Titular,Invitado'],
            'representantes.*.asistio' => ['nullable', 'in:si,no,pendiente'],
        ]);

        $payload = [];
        foreach ($data['representantes'] as $item) {
            $payload[$item['id_representante']] = [
                'rol_participacion' => $item['rol_participacion'] ?? 'Titular',
                'asistio' => $item['asistio'] ?? 'pendiente',
            ];
        }

        $reunion->representantes()->sync($payload);

        return response()->json($reunion->load('representantes'));
    }
}
