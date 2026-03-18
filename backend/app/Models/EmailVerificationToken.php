<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailVerificationToken extends Model
{
    protected $table = 'email_verification_tokens';

    const CREATED_AT = 'solicitado_en';

    const UPDATED_AT = null;

    protected $fillable = [
        'id_usuario',
        'token_hash',
        'expira_en',
        'usado_en',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expira_en' => 'datetime',
        'usado_en' => 'datetime',
        'solicitado_en' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
