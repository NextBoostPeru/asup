<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Support\HistorialLogger;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RolController extends Controller
{
    public function index()
    {
        return response()->json(
            Rol::query()
                ->with('moduloPermisos')
                ->orderBy('nombre')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $allowedModules = array_map(fn ($m) => $m['key'], Rbac::modulos());

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:roles,nombre'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:roles,slug'],
            'descripcion' => ['nullable', 'string'],
            'permisos' => ['required', 'array', 'min:1'],
            'permisos.*.modulo' => ['required', 'string', 'in:'.implode(',', $allowedModules)],
            'permisos.*.puede_ver' => ['sometimes', 'boolean'],
            'permisos.*.puede_agregar' => ['sometimes', 'boolean'],
            'permisos.*.puede_editar' => ['sometimes', 'boolean'],
            'permisos.*.puede_eliminar' => ['sometimes', 'boolean'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['nombre']);

        $rol = Rol::create([
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'descripcion' => $data['descripcion'] ?? null,
            'es_sistema' => false,
        ]);

        $this->syncPermisos($rol, $data['permisos']);

        HistorialLogger::log(
            $request->user()?->getKey(),
            'rol_creado',
            'roles',
            (string) $rol->getKey(),
            'Creación de rol',
            null,
            $rol->load('moduloPermisos')->toArray()
        );

        return response()->json($rol->load('moduloPermisos'), 201);
    }

    public function show(Rol $rol)
    {
        return response()->json($rol->load('moduloPermisos'));
    }

    public function update(Request $request, Rol $rol)
    {
        $allowedModules = array_map(fn ($m) => $m['key'], Rbac::modulos());

        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:100', 'unique:roles,nombre,'.$rol->getKey().',id_rol'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:100', 'unique:roles,slug,'.$rol->getKey().',id_rol'],
            'descripcion' => ['sometimes', 'nullable', 'string'],
            'permisos' => ['sometimes', 'required', 'array'],
            'permisos.*.modulo' => ['required_with:permisos', 'string', 'in:'.implode(',', $allowedModules)],
            'permisos.*.puede_ver' => ['sometimes', 'boolean'],
            'permisos.*.puede_agregar' => ['sometimes', 'boolean'],
            'permisos.*.puede_editar' => ['sometimes', 'boolean'],
            'permisos.*.puede_eliminar' => ['sometimes', 'boolean'],
        ]);

        if ($rol->es_sistema) {
            if (array_key_exists('nombre', $data) || array_key_exists('slug', $data)) {
                return response()->json(['message' => 'No se puede modificar nombre o slug de un rol del sistema.'], 422);
            }
        }

        $antes = $rol->load('moduloPermisos')->toArray();

        if (array_key_exists('nombre', $data)) {
            $rol->nombre = $data['nombre'];
        }
        if (array_key_exists('slug', $data)) {
            $rol->slug = $data['slug'] ?: Str::slug($rol->nombre);
        }
        if (array_key_exists('descripcion', $data)) {
            $rol->descripcion = $data['descripcion'];
        }

        $rol->save();

        if (array_key_exists('permisos', $data)) {
            $this->syncPermisos($rol, $data['permisos']);
        }

        $despues = $rol->load('moduloPermisos')->toArray();
        HistorialLogger::log(
            $request->user()?->getKey(),
            'rol_actualizado',
            'roles',
            (string) $rol->getKey(),
            'Actualización de rol',
            $antes,
            $despues
        );

        return response()->json($rol->load('moduloPermisos'));
    }

    public function destroy(Request $request, Rol $rol)
    {
        if ($rol->es_sistema) {
            return response()->json(['message' => 'No se puede eliminar un rol del sistema.'], 422);
        }

        $inUse = DB::table('usuarios')->where('id_rol', $rol->getKey())->exists();
        if ($inUse) {
            return response()->json(['message' => 'No se puede eliminar: hay usuarios asignados a este rol.'], 422);
        }

        $antes = $rol->load('moduloPermisos')->toArray();
        $rol->delete();

        HistorialLogger::log(
            $request->user()?->getKey(),
            'rol_eliminado',
            'roles',
            (string) $rol->getKey(),
            'Eliminación de rol',
            $antes,
            null
        );

        return response()->json(null, 204);
    }

    private function syncPermisos(Rol $rol, array $permisos): void
    {
        DB::table('rol_modulo_permisos')->where('id_rol', $rol->getKey())->delete();

        $rows = [];
        foreach ($permisos as $item) {
            $rows[] = [
                'id_rol' => (int) $rol->getKey(),
                'modulo' => (string) $item['modulo'],
                'puede_ver' => (bool) ($item['puede_ver'] ?? false),
                'puede_agregar' => (bool) ($item['puede_agregar'] ?? false),
                'puede_editar' => (bool) ($item['puede_editar'] ?? false),
                'puede_eliminar' => (bool) ($item['puede_eliminar'] ?? false),
            ];
        }

        if (count($rows) > 0) {
            DB::table('rol_modulo_permisos')->insert($rows);
        }
    }
}
