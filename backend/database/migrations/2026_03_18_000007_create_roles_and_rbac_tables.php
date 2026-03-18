<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id_rol');
            $table->string('nombre', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('es_sistema')->default(false);
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('rol_modulo_permisos', function (Blueprint $table) {
            $table->unsignedInteger('id_rol');
            $table->string('modulo', 80);
            $table->boolean('puede_ver')->default(false);
            $table->boolean('puede_agregar')->default(false);
            $table->boolean('puede_editar')->default(false);
            $table->boolean('puede_eliminar')->default(false);

            $table->primary(['id_rol', 'modulo']);
            $table->index('modulo', 'idx_rol_modulo_permisos_modulo');

            $table
                ->foreign('id_rol')
                ->references('id_rol')
                ->on('roles')
                ->cascadeOnDelete();
        });

        Schema::table('usuarios', function (Blueprint $table) {
            $table->unsignedInteger('id_rol')->nullable()->after('rol');
            $table->index('id_rol', 'idx_usuarios_id_rol');
            $table
                ->foreign('id_rol')
                ->references('id_rol')
                ->on('roles')
                ->nullOnDelete();
        });

        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE usuarios MODIFY rol VARCHAR(100) NOT NULL DEFAULT 'visor'");
        }

        $modulos = [
            'sectores',
            'instituciones',
            'representantes',
            'reuniones',
            'actas',
            'documentos-institucion',
            'documentos-representante',
            'alertas',
            'usuarios',
            'historial',
            'roles',
        ];

        $idAdmin = DB::table('roles')->insertGetId([
            'nombre' => 'Administrador',
            'slug' => 'administrador',
            'descripcion' => 'Acceso total al sistema',
            'es_sistema' => true,
            'fecha_creacion' => now(),
            'fecha_actualizacion' => now(),
        ]);
        $idEditor = DB::table('roles')->insertGetId([
            'nombre' => 'Editor',
            'slug' => 'editor',
            'descripcion' => 'Puede crear y editar contenido',
            'es_sistema' => true,
            'fecha_creacion' => now(),
            'fecha_actualizacion' => now(),
        ]);
        $idVisor = DB::table('roles')->insertGetId([
            'nombre' => 'Visor',
            'slug' => 'visor',
            'descripcion' => 'Acceso de solo lectura',
            'es_sistema' => true,
            'fecha_creacion' => now(),
            'fecha_actualizacion' => now(),
        ]);

        $rows = [];
        foreach ($modulos as $modulo) {
            $rows[] = [
                'id_rol' => $idAdmin,
                'modulo' => $modulo,
                'puede_ver' => true,
                'puede_agregar' => true,
                'puede_editar' => true,
                'puede_eliminar' => true,
            ];
        }

        $modulosEditor = array_values(array_filter($modulos, fn ($m) => ! in_array($m, ['usuarios', 'historial', 'roles'], true)));
        foreach ($modulosEditor as $modulo) {
            $rows[] = [
                'id_rol' => $idEditor,
                'modulo' => $modulo,
                'puede_ver' => true,
                'puede_agregar' => true,
                'puede_editar' => true,
                'puede_eliminar' => false,
            ];
        }

        $modulosVisor = array_values(array_filter($modulos, fn ($m) => ! in_array($m, ['usuarios', 'historial', 'roles'], true)));
        foreach ($modulosVisor as $modulo) {
            $rows[] = [
                'id_rol' => $idVisor,
                'modulo' => $modulo,
                'puede_ver' => true,
                'puede_agregar' => false,
                'puede_editar' => false,
                'puede_eliminar' => false,
            ];
        }

        DB::table('rol_modulo_permisos')->insert($rows);

        DB::table('usuarios')->where('rol', 'administrador')->update(['id_rol' => $idAdmin, 'rol' => 'administrador']);
        DB::table('usuarios')->where('rol', 'editor')->update(['id_rol' => $idEditor, 'rol' => 'editor']);
        DB::table('usuarios')->where('rol', 'visor')->update(['id_rol' => $idVisor, 'rol' => 'visor']);
        DB::table('usuarios')->whereNull('id_rol')->update(['id_rol' => $idVisor, 'rol' => 'visor']);
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropForeign(['id_rol']);
            $table->dropIndex('idx_usuarios_id_rol');
            $table->dropColumn('id_rol');
        });

        Schema::dropIfExists('rol_modulo_permisos');
        Schema::dropIfExists('roles');
    }
};
