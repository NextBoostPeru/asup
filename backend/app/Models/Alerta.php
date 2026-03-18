<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alerta extends Model
{
    protected $table = 'alertas';

    protected $primaryKey = 'id_alerta';

    public $timestamps = false;

    protected $fillable = [
        'id_representante',
        'tipo_alerta',
        'estado',
        'fecha_objetivo',
        'fecha_generada',
        'fecha_leida',
    ];

    protected $casts = [
        'fecha_objetivo' => 'date',
        'fecha_generada' => 'datetime',
        'fecha_leida' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    public function representante(): BelongsTo
    {
        return $this->belongsTo(Representante::class, 'id_representante', 'id_representante');
    }
}
