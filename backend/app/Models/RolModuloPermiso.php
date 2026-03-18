<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolModuloPermiso extends Model
{
    protected $table = 'rol_modulo_permisos';

    public $timestamps = false;

    protected $primaryKey = null;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_rol',
        'modulo',
        'puede_ver',
        'puede_agregar',
        'puede_editar',
        'puede_eliminar',
    ];

    protected $casts = [
        'puede_ver' => 'boolean',
        'puede_agregar' => 'boolean',
        'puede_editar' => 'boolean',
        'puede_eliminar' => 'boolean',
    ];

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }
}
