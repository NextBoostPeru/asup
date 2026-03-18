<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentoRepresentante;
use Illuminate\Http\Request;

class DocumentoRepresentanteController extends Controller
{
    public function index(Request $request)
    {
        $query = DocumentoRepresentante::query()->with('representante');

        if ($request->filled('id_representante')) {
            $query->where('id_representante', $request->integer('id_representante'));
        }

        if ($request->filled('tipo_documento')) {
            $query->where('tipo_documento', $request->string('tipo_documento'));
        }

        return response()->json($query->orderByDesc('fecha_subida')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_representante' => ['required', 'integer', 'exists:representantes,id_representante'],
            'tipo_documento' => ['required', 'in:CV,Resolucion'],
            'nombre_archivo' => ['required', 'string', 'max:255'],
            'tipo_archivo' => ['required', 'string', 'max:100'],
            'ruta_archivo' => ['required', 'string'],
            'hash_sha256' => ['nullable', 'string', 'size:64'],
        ]);

        $documento = DocumentoRepresentante::create($data);

        return response()->json($documento->load('representante'), 201);
    }

    public function show(DocumentoRepresentante $documentoRepresentante)
    {
        return response()->json($documentoRepresentante->load('representante'));
    }

    public function update(Request $request, DocumentoRepresentante $documentoRepresentante)
    {
        $data = $request->validate([
            'id_representante' => ['sometimes', 'required', 'integer', 'exists:representantes,id_representante'],
            'tipo_documento' => ['sometimes', 'required', 'in:CV,Resolucion'],
            'nombre_archivo' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo_archivo' => ['sometimes', 'required', 'string', 'max:100'],
            'ruta_archivo' => ['sometimes', 'required', 'string'],
            'hash_sha256' => ['sometimes', 'nullable', 'string', 'size:64'],
        ]);

        $documentoRepresentante->fill($data)->save();

        return response()->json($documentoRepresentante->load('representante'));
    }

    public function destroy(DocumentoRepresentante $documentoRepresentante)
    {
        $documentoRepresentante->delete();

        return response()->json(null, 204);
    }
}
