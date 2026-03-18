<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rol extends Model
{
    protected $table = 'roles';

    protected $primaryKey = 'id_rol';

    const CREATED_AT = 'fecha_creacion';

    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'es_sistema',
    ];

    protected $casts = [
        'es_sistema' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function moduloPermisos(): HasMany
    {
        return $this->hasMany(RolModuloPermiso::class, 'id_rol', 'id_rol');
    }
}
