<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Representante;
use Illuminate\Http\Request;

class RepresentanteController extends Controller
{
    public function index(Request $request)
    {
        $query = Representante::query()->with(['institucion']);

        if ($request->filled('id_institucion')) {
            $query->where('id_institucion', $request->integer('id_institucion'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('dni')) {
            $query->where('dni', $request->string('dni'));
        }

        return response()->json($query->orderBy('apellidos')->orderBy('nombres')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:150'],
            'apellidos' => ['required', 'string', 'max:150'],
            'dni' => ['required', 'digits:8', 'unique:representantes,dni'],
            'universidad' => ['nullable', 'string', 'max:200'],
            'celular' => ['nullable', 'string', 'max:15'],
            'correo' => ['nullable', 'email', 'max:150'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => ['nullable', 'in:en_curso,vencido,inactivo'],
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id_institucion'],
        ]);

        $representante = Representante::create($data);

        return response()->json($representante->load('institucion'), 201);
    }

    public function show(Representante $representante)
    {
        return response()->json($representante->load(['institucion', 'documentos', 'alertas', 'reuniones']));
    }

    public function update(Request $request, Representante $representante)
    {
        $data = $request->validate([
            'nombres' => ['sometimes', 'required', 'string', 'max:150'],
            'apellidos' => ['sometimes', 'required', 'string', 'max:150'],
            'dni' => ['sometimes', 'required', 'digits:8', 'unique:representantes,dni,'.$representante->getKey().',id_representante'],
            'universidad' => ['sometimes', 'nullable', 'string', 'max:200'],
            'celular' => ['sometimes', 'nullable', 'string', 'max:15'],
            'correo' => ['sometimes', 'nullable', 'email', 'max:150'],
            'fecha_inicio' => ['sometimes', 'nullable', 'date'],
            'fecha_fin' => ['sometimes', 'nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => ['sometimes', 'nullable', 'in:en_curso,vencido,inactivo'],
            'id_institucion' => ['sometimes', 'required', 'integer', 'exists:instituciones,id_institucion'],
        ]);

        $representante->fill($data)->save();

        return response()->json($representante->load('institucion'));
    }

    public function destroy(Representante $representante)
    {
        $representante->delete();

        return response()->json(null, 204);
    }
}
