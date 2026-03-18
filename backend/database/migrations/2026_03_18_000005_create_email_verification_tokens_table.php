<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verification_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('id_usuario');
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expira_en')->nullable();
            $table->timestamp('solicitado_en')->useCurrent();
            $table->timestamp('usado_en')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->index('id_usuario', 'idx_email_verification_tokens_id_usuario');
            $table->index('solicitado_en', 'idx_email_verification_tokens_solicitado_en');

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
        Schema::dropIfExists('email_verification_tokens');
    }
};
