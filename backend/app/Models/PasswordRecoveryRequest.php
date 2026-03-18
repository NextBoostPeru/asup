<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordRecoveryRequest extends Model
{
    protected $table = 'password_recovery_requests';

    const CREATED_AT = 'solicitado_en';

    const UPDATED_AT = null;

    protected $fillable = [
        'id_usuario',
        'correo',
        'token_hash',
        'expira_en',
        'usado_en',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expira_en' => 'datetime',
        'solicitado_en' => 'datetime',
        'usado_en' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
