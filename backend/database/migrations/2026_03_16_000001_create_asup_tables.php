<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sectores', function (Blueprint $table) {
            $table->increments('id_sector');
            $table->string('nombre_sector', 150)->unique();
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('instituciones', function (Blueprint $table) {
            $table->increments('id_institucion');
            $table->string('nombre', 200);
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('id_sector');

            $table->index('id_sector', 'idx_instituciones_id_sector');
            $table->index('estado', 'idx_instituciones_estado');

            $table
                ->foreign('id_sector')
                ->references('id_sector')
                ->on('sectores')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::create('documentos_institucion', function (Blueprint $table) {
            $table->increments('id_documento');
            $table->unsignedInteger('id_institucion');
            $table->string('nombre_archivo', 255);
            $table->string('tipo_archivo', 100);
            $table->text('ruta_archivo');
            $table->char('hash_sha256', 64)->nullable();
            $table->timestamp('fecha_subida')->useCurrent();

            $table->index('id_institucion', 'idx_documentos_institucion_id_institucion');

            $table
                ->foreign('id_institucion')
                ->references('id_institucion')
                ->on('instituciones')
                ->cascadeOnDelete();
        });

        Schema::create('representantes', function (Blueprint $table) {
            $table->increments('id_representante');
            $table->string('nombres', 150);
            $table->string('apellidos', 150);
            $table->char('dni', 8)->unique();
            $table->string('universidad', 200)->nullable();
            $table->string('celular', 15)->nullable();
            $table->string('correo', 150)->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->enum('estado', ['en_curso', 'vencido', 'inactivo'])->default('en_curso');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->unsignedInteger('id_institucion');

            $table->index('id_institucion', 'idx_representantes_id_institucion');
            $table->index('estado', 'idx_representantes_estado');
            $table->index('fecha_fin', 'idx_representantes_fecha_fin');

            $table
                ->foreign('id_institucion')
                ->references('id_institucion')
                ->on('instituciones')
                ->cascadeOnDelete();
        });

        Schema::create('documentos_representante', function (Blueprint $table) {
            $table->increments('id_documento');
            $table->unsignedInteger('id_representante');
            $table->enum('tipo_documento', ['CV', 'Resolucion']);
            $table->string('nombre_archivo', 255);
            $table->string('tipo_archivo', 100);
            $table->text('ruta_archivo');
            $table->char('hash_sha256', 64)->nullable();
            $table->timestamp('fecha_subida')->useCurrent();

            $table->index('id_representante', 'idx_documentos_representante_id_representante');

            $table
                ->foreign('id_representante')
                ->references('id_representante')
                ->on('representantes')
                ->cascadeOnDelete();
        });

        Schema::create('alertas', function (Blueprint $table) {
            $table->increments('id_alerta');
            $table->unsignedInteger('id_representante');
            $table->enum('tipo_alerta', ['60_dias', '30_dias', '7_dias']);
            $table->enum('estado', ['pendiente', 'leida'])->default('pendiente');
            $table->date('fecha_objetivo');
            $table->timestamp('fecha_generada')->useCurrent();
            $table->timestamp('fecha_leida')->nullable();

            $table->unique(
                ['id_representante', 'tipo_alerta', 'fecha_objetivo'],
                'uq_alertas_representante_tipo_objetivo'
            );
            $table->index(['estado', 'fecha_generada'], 'idx_alertas_estado_fecha');
            $table->index('id_representante', 'idx_alertas_id_representante');

            $table
                ->foreign('id_representante')
                ->references('id_representante')
                ->on('representantes')
                ->cascadeOnDelete();
        });

        Schema::create('reuniones', function (Blueprint $table) {
            $table->increments('id_reunion');
            $table->enum('tipo_reunion', ['Consejo', 'Directorio']);
            $table->date('fecha');
            $table->time('hora')->nullable();
            $table->enum('modalidad', ['Presencial', 'Virtual']);
            $table->string('lugar', 255)->nullable();
            $table->text('enlace')->nullable();
            $table->string('frecuencia', 100)->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();

            $table->index('fecha', 'idx_reuniones_fecha');
        });

        Schema::create('reunion_representantes', function (Blueprint $table) {
            $table->unsignedInteger('id_reunion');
            $table->unsignedInteger('id_representante');
            $table->enum('rol_participacion', ['Titular', 'Invitado'])->default('Titular');
            $table->enum('asistio', ['si', 'no', 'pendiente'])->default('pendiente');

            $table->primary(['id_reunion', 'id_representante']);
            $table->index('id_representante', 'idx_reunion_representantes_id_representante');

            $table
                ->foreign('id_reunion')
                ->references('id_reunion')
                ->on('reuniones')
                ->cascadeOnDelete();

            $table
                ->foreign('id_representante')
                ->references('id_representante')
                ->on('representantes')
                ->cascadeOnDelete();
        });

        Schema::create('actas', function (Blueprint $table) {
            $table->increments('id_acta');
            $table->unsignedInteger('id_reunion');
            $table->string('nombre_archivo', 255);
            $table->string('tipo_archivo', 100);
            $table->text('ruta_archivo');
            $table->char('hash_sha256', 64)->nullable();
            $table->timestamp('fecha_subida')->useCurrent();

            $table->index('id_reunion', 'idx_actas_id_reunion');

            $table
                ->foreign('id_reunion')
                ->references('id_reunion')
                ->on('reuniones')
                ->cascadeOnDelete();
        });

        Schema::create('usuarios', function (Blueprint $table) {
            $table->increments('id_usuario');
            $table->string('nombres', 200);
            $table->string('correo', 150)->unique();
            $table->string('password', 255);
            $table->enum('rol', ['administrador', 'editor', 'visor'])->default('visor');
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->dateTime('ultimo_acceso')->nullable();

            $table->index('estado', 'idx_usuarios_estado');
            $table->index('rol', 'idx_usuarios_rol');
        });

        Schema::create('historial', function (Blueprint $table) {
            $table->increments('id_historial');
            $table->unsignedInteger('id_usuario')->nullable();
            $table->string('accion', 255);
            $table->string('tabla_afectada', 100);
            $table->string('id_registro_afectado', 64)->nullable();
            $table->text('descripcion')->nullable();
            $table->json('valores_antes')->nullable();
            $table->json('valores_despues')->nullable();
            $table->timestamp('fecha')->useCurrent();

            $table->index('id_usuario', 'idx_historial_id_usuario');
            $table->index(['tabla_afectada', 'fecha'], 'idx_historial_tabla_fecha');

            $table
                ->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial');
        Schema::dropIfExists('actas');
        Schema::dropIfExists('reunion_representantes');
        Schema::dropIfExists('reuniones');
        Schema::dropIfExists('alertas');
        Schema::dropIfExists('documentos_representante');
        Schema::dropIfExists('representantes');
        Schema::dropIfExists('documentos_institucion');
        Schema::dropIfExists('instituciones');
        Schema::dropIfExists('sectores');
        Schema::dropIfExists('usuarios');
    }
};
