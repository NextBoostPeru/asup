<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use App\Support\HistorialLogger;
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

        return response()->json($query->orderBy('nombres')->orderBy('apellidos')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:200'],
            'apellidos' => ['required', 'string', 'max:200'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8'],
            'rol' => ['nullable', 'string', 'max:100'],
            'id_rol' => ['nullable', 'integer', 'exists:roles,id_rol'],
            'estado' => ['nullable', 'in:activo,inactivo,suspendido'],
        ]);

        $data['password'] = Hash::make($data['password']);
        if (array_key_exists('id_rol', $data) && $data['id_rol']) {
            $rol = Rol::query()->find((int) $data['id_rol']);
            if ($rol) {
                $data['rol'] = $rol->slug;
            }
        } else {
            $slug = (string) ($data['rol'] ?? 'visor');
            $rol = Rol::query()->where('slug', $slug)->first();
            if ($rol) {
                $data['id_rol'] = (int) $rol->getKey();
                $data['rol'] = $rol->slug;
            }
        }

        $usuario = Usuario::create($data);

        HistorialLogger::log(
            $request->user()?->getKey(),
            'usuario_creado',
            'usuarios',
            (string) $usuario->getKey(),
            'Creación de usuario por administrador',
            null,
            $usuario->toArray()
        );

        return response()->json($usuario, 201);
    }

    public function show(Usuario $usuario)
    {
        return response()->json($usuario->load('historial'));
    }

    public function update(Request $request, Usuario $usuario)
    {
        $antes = $usuario->toArray();

        $data = $request->validate([
            'nombres' => ['sometimes', 'required', 'string', 'max:200'],
            'apellidos' => ['sometimes', 'required', 'string', 'max:200'],
            'correo' => ['sometimes', 'required', 'email', 'max:150', 'unique:usuarios,correo,'.$usuario->getKey().',id_usuario'],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'rol' => ['sometimes', 'nullable', 'string', 'max:100'],
            'id_rol' => ['sometimes', 'nullable', 'integer', 'exists:roles,id_rol'],
            'estado' => ['sometimes', 'nullable', 'in:activo,inactivo,suspendido'],
            'ultimo_acceso' => ['sometimes', 'nullable', 'date'],
            'email_verificado_en' => ['sometimes', 'nullable', 'date'],
        ]);

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }
        if (array_key_exists('id_rol', $data) && $data['id_rol']) {
            $rol = Rol::query()->find((int) $data['id_rol']);
            if ($rol) {
                $data['rol'] = $rol->slug;
            }
        } elseif (array_key_exists('rol', $data) && $data['rol']) {
            $rol = Rol::query()->where('slug', (string) $data['rol'])->first();
            if ($rol) {
                $data['id_rol'] = (int) $rol->getKey();
                $data['rol'] = $rol->slug;
            }
        }

        $usuario->fill($data)->save();

        HistorialLogger::log(
            $request->user()?->getKey(),
            'usuario_actualizado',
            'usuarios',
            (string) $usuario->getKey(),
            'Actualización de usuario',
            $antes,
            $usuario->toArray()
        );

        return response()->json($usuario);
    }

    public function destroy(Usuario $usuario)
    {
        $antes = $usuario->toArray();
        $usuario->forceFill(['estado' => 'inactivo'])->save();

        HistorialLogger::log(
            request()->user()?->getKey(),
            'usuario_desactivado',
            'usuarios',
            (string) $usuario->getKey(),
            'Desactivación de usuario',
            $antes,
            $usuario->toArray()
        );

        return response()->json($usuario);
    }
}
