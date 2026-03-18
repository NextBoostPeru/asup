<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    protected $table = 'sectores';
    protected $primaryKey = 'id_sector';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'nombre_sector',
        'estado',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function instituciones(): HasMany
    {
        return $this->hasMany(Institucion::class, 'id_sector', 'id_sector');
    }
}
