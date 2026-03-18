<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentoInstitucion;
use Illuminate\Http\Request;

class DocumentoInstitucionController extends Controller
{
    public function index(Request $request)
    {
        $query = DocumentoInstitucion::query()->with('institucion');

        if ($request->filled('id_institucion')) {
            $query->where('id_institucion', $request->integer('id_institucion'));
        }

        return response()->json($query->orderByDesc('fecha_subida')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id_institucion'],
            'nombre_archivo' => ['required', 'string', 'max:255'],
            'tipo_archivo' => ['required', 'string', 'max:100'],
            'ruta_archivo' => ['required', 'string'],
            'hash_sha256' => ['nullable', 'string', 'size:64'],
        ]);

        $documento = DocumentoInstitucion::create($data);

        return response()->json($documento->load('institucion'), 201);
    }

    public function show(DocumentoInstitucion $documentoInstitucion)
    {
        return response()->json($documentoInstitucion->load('institucion'));
    }

    public function update(Request $request, DocumentoInstitucion $documentoInstitucion)
    {
        $data = $request->validate([
            'id_institucion' => ['sometimes', 'required', 'integer', 'exists:instituciones,id_institucion'],
            'nombre_archivo' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo_archivo' => ['sometimes', 'required', 'string', 'max:100'],
            'ruta_archivo' => ['sometimes', 'required', 'string'],
            'hash_sha256' => ['sometimes', 'nullable', 'string', 'size:64'],
        ]);

        $documentoInstitucion->fill($data)->save();

        return response()->json($documentoInstitucion->load('institucion'));
    }

    public function destroy(DocumentoInstitucion $documentoInstitucion)
    {
        $documentoInstitucion->delete();

        return response()->json(null, 204);
    }
}
