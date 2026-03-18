<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoRepresentante extends Model
{
    protected $table = 'documentos_representante';

    protected $primaryKey = 'id_documento';

    public $timestamps = false;

    protected $fillable = [
        'id_representante',
        'tipo_documento',
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

    public function representante(): BelongsTo
    {
        return $this->belongsTo(Representante::class, 'id_representante', 'id_representante');
    }
}
