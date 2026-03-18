<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reunion extends Model
{
    protected $table = 'reuniones';
    protected $primaryKey = 'id_reunion';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'tipo_reunion',
        'fecha',
        'hora',
        'modalidad',
        'lugar',
        'enlace',
        'frecuencia',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function actas(): HasMany
    {
        return $this->hasMany(Acta::class, 'id_reunion', 'id_reunion');
    }

    public function representantes(): BelongsToMany
    {
        return $this->belongsToMany(Representante::class, 'reunion_representantes', 'id_reunion', 'id_representante')
            ->withPivot(['rol_participacion', 'asistio']);
    }
}
