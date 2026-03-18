<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Institucion;
use Illuminate\Http\Request;

class InstitucionController extends Controller
{
    public function index(Request $request)
    {
        $query = Institucion::query()->with(['sector']);

        if ($request->filled('id_sector')) {
            $query->where('id_sector', $request->integer('id_sector'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        return response()->json($query->orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['nullable', 'in:activo,inactivo'],
            'id_sector' => ['required', 'integer', 'exists:sectores,id_sector'],
        ]);

        $institucion = Institucion::create($data);

        return response()->json($institucion->load('sector'), 201);
    }

    public function show(Institucion $institucion)
    {
        return response()->json($institucion->load(['sector', 'representantes', 'documentos']));
    }

    public function update(Request $request, Institucion $institucion)
    {
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:200'],
            'descripcion' => ['sometimes', 'nullable', 'string'],
            'estado' => ['sometimes', 'nullable', 'in:activo,inactivo'],
            'id_sector' => ['sometimes', 'required', 'integer', 'exists:sectores,id_sector'],
        ]);

        $institucion->fill($data)->save();

        return response()->json($institucion->load('sector'));
    }

    public function destroy(Institucion $institucion)
    {
        $institucion->delete();

        return response()->json(null, 204);
    }
}
