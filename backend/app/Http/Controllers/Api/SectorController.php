<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sector;
use Illuminate\Http\Request;

class SectorController extends Controller
{
    public function index()
    {
        return response()->json(Sector::query()->orderBy('nombre_sector')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre_sector' => ['required', 'string', 'max:150'],
            'estado' => ['nullable', 'in:activo,inactivo'],
        ]);

        $sector = Sector::create($data);

        return response()->json($sector, 201);
    }

    public function show(Sector $sector)
    {
        return response()->json($sector);
    }

    public function update(Request $request, Sector $sector)
    {
        $data = $request->validate([
            'nombre_sector' => ['sometimes', 'required', 'string', 'max:150'],
            'estado' => ['sometimes', 'nullable', 'in:activo,inactivo'],
        ]);

        $sector->fill($data)->save();

        return response()->json($sector);
    }

    public function destroy(Sector $sector)
    {
        $sector->delete();

        return response()->json(null, 204);
    }
}
