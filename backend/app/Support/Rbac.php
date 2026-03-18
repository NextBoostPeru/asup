<?php

namespace App\Support;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class Rbac
{
    public static function modulos(): array
    {
        return [
            ['key' => 'sectores', 'label' => 'Sectores'],
            ['key' => 'instituciones', 'label' => 'Instituciones'],
            ['key' => 'representantes', 'label' => 'Representantes'],
            ['key' => 'reuniones', 'label' => 'Reuniones'],
            ['key' => 'actas', 'label' => 'Actas'],
            ['key' => 'documentos-institucion', 'label' => 'Documentos (Institución)'],
            ['key' => 'documentos-representante', 'label' => 'Documentos (Representante)'],
            ['key' => 'alertas', 'label' => 'Alertas'],
            ['key' => 'usuarios', 'label' => 'Usuarios'],
            ['key' => 'historial', 'label' => 'Historial'],
            ['key' => 'roles', 'label' => 'Roles y permisos'],
        ];
    }

    public static function permisosDeUsuario(?Usuario $usuario): array
    {
        if (! $usuario) {
            return [];
        }

        if (self::resolveSlug($usuario) === 'administrador') {
            $map = [];
            foreach (self::modulos() as $m) {
                $map[$m['key']] = [
                    'ver' => true,
                    'agregar' => true,
                    'editar' => true,
                    'eliminar' => true,
                ];
            }

            return $map;
        }

        $idRol = self::resolveIdRol($usuario);
        if ($idRol <= 0) {
            return [];
        }

        return self::permisosPorRol($idRol);
    }

    public static function permisosPorRol(int $idRol): array
    {
        $rows = DB::table('rol_modulo_permisos')
            ->where('id_rol', $idRol)
            ->get(['modulo', 'puede_ver', 'puede_agregar', 'puede_editar', 'puede_eliminar']);

        $map = [];
        foreach ($rows as $row) {
            $map[$row->modulo] = [
                'ver' => (bool) $row->puede_ver,
                'agregar' => (bool) $row->puede_agregar,
                'editar' => (bool) $row->puede_editar,
                'eliminar' => (bool) $row->puede_eliminar,
            ];
        }

        return $map;
    }

    public static function puede(Usuario $usuario, string $modulo, string $accion): bool
    {
        if (self::resolveSlug($usuario) === 'administrador') {
            return true;
        }

        $idRol = self::resolveIdRol($usuario);
        if ($idRol <= 0) {
            return false;
        }

        $permisos = self::permisosPorRol($idRol);
        if (! isset($permisos[$modulo])) {
            return false;
        }

        $fila = $permisos[$modulo];

        return (bool) ($fila[$accion] ?? false);
    }

    private static function resolveIdRol(Usuario $usuario): int
    {
        $idRol = (int) ($usuario->id_rol ?? 0);
        if ($idRol > 0) {
            return $idRol;
        }

        $slug = trim((string) ($usuario->rol ?? ''));
        if ($slug === '') {
            return 0;
        }

        $found = DB::table('roles')->where('slug', $slug)->value('id_rol');
        $idRol = (int) ($found ?? 0);

        if ($idRol > 0 && $usuario->getKey()) {
            $usuario->id_rol = $idRol;
            DB::table('usuarios')->where('id_usuario', $usuario->getKey())->update(['id_rol' => $idRol]);
        }

        return $idRol;
    }

    private static function resolveSlug(Usuario $usuario): ?string
    {
        $slug = trim((string) ($usuario->rol ?? ''));
        if ($slug !== '') {
            return $slug;
        }

        $idRol = (int) ($usuario->id_rol ?? 0);
        if ($idRol <= 0) {
            return null;
        }

        $found = DB::table('roles')->where('id_rol', $idRol)->value('slug');
        $slug = is_string($found) ? trim($found) : '';

        return $slug !== '' ? $slug : null;
    }
}
