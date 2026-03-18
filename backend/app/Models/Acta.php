<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Acta extends Model
{
    protected $table = 'actas';

    protected $primaryKey = 'id_acta';

    public $timestamps = false;

    protected $fillable = [
        'id_reunion',
        'nombre_archivo',
        'tipo_archivo',
        'ruta_archivo',
        'hash_sha256',
        'fecha_subida',
    ];

    protected $casts = [
        'fecha_subida' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function reunion(): BelongsTo
    {
        return $this->belongsTo(Reunion::class, 'id_reunion', 'id_reunion');
    }
}
