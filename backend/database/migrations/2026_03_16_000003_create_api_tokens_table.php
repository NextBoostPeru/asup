<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('id_usuario');
            $table->char('token_hash', 64)->unique();
            $table->string('nombre', 100)->nullable();
            $table->timestamp('ultimo_uso')->nullable();
            $table->timestamp('expira_en')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_actualizacion')->nullable()->useCurrent()->useCurrentOnUpdate();

            $table->index('id_usuario', 'idx_api_tokens_id_usuario');

            $table
                ->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
    }
};
