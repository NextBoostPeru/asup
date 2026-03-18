<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Representante extends Model
{
    protected $table = 'representantes';

    protected $primaryKey = 'id_representante';

    const CREATED_AT = 'fecha_creacion';

    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'nombres',
        'apellidos',
        'dni',
        'universidad',
        'celular',
        'correo',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'id_institucion',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion', 'id_institucion');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(DocumentoRepresentante::class, 'id_representante', 'id_representante');
    }

    public function alertas(): HasMany
    {
        return $this->hasMany(Alerta::class, 'id_representante', 'id_representante');
    }

    public function reuniones(): BelongsToMany
    {
        return $this->belongsToMany(Reunion::class, 'reunion_representantes', 'id_representante', 'id_reunion')
            ->withPivot(['rol_participacion', 'asistio']);
    }
}
