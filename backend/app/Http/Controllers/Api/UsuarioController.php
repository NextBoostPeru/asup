<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $query = Usuario::query();

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('rol')) {
            $query->where('rol', $request->string('rol'));
        }

        return response()->json($query->orderBy('nombres')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:200'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8'],
            'rol' => ['nullable', 'in:administrador,editor,visor'],
            'estado' => ['nullable', 'in:activo,inactivo,suspendido'],
        ]);

        $data['password'] = Hash::make($data['password']);

        $usuario = Usuario::create($data);

        return response()->json($usuario, 201);
    }

    public function show(Usuario $usuario)
    {
        return response()->json($usuario->load('historial'));
    }

    public function update(Request $request, Usuario $usuario)
    {
        $data = $request->validate([
            'nombres' => ['sometimes', 'required', 'string', 'max:200'],
            'correo' => ['sometimes', 'required', 'email', 'max:150', 'unique:usuarios,correo,' . $usuario->getKey() . ',id_usuario'],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'rol' => ['sometimes', 'nullable', 'in:administrador,editor,visor'],
            'estado' => ['sometimes', 'nullable', 'in:activo,inactivo,suspendido'],
            'ultimo_acceso' => ['sometimes', 'nullable', 'date'],
        ]);

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }

        $usuario->fill($data)->save();

        return response()->json($usuario);
    }

    public function destroy(Usuario $usuario)
    {
        $usuario->delete();

        return response()->json(null, 204);
    }
}
