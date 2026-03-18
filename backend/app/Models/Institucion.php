<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institucion extends Model
{
    protected $table = 'instituciones';

    protected $primaryKey = 'id_institucion';

    const CREATED_AT = 'fecha_creacion';

    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
        'id_sector',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class, 'id_sector', 'id_sector');
    }

    public function representantes(): HasMany
    {
        return $this->hasMany(Representante::class, 'id_institucion', 'id_institucion');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(DocumentoInstitucion::class, 'id_institucion', 'id_institucion');
    }
}
