<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->timestamp('email_verificado_en')->nullable()->after('ultimo_acceso');
            $table->index('email_verificado_en', 'idx_usuarios_email_verificado_en');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropIndex('idx_usuarios_email_verificado_en');
            $table->dropColumn('email_verificado_en');
        });
    }
};
