<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_recovery_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('id_usuario')->nullable();
            $table->string('correo', 150);
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expira_en')->nullable();
            $table->timestamp('solicitado_en')->useCurrent();
            $table->timestamp('usado_en')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->index('correo', 'idx_password_recovery_requests_correo');
            $table->index('solicitado_en', 'idx_password_recovery_requests_solicitado_en');
            $table->index('id_usuario', 'idx_password_recovery_requests_id_usuario');

            $table
                ->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_recovery_requests');
    }
};
