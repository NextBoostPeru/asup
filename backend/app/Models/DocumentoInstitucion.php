<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoInstitucion extends Model
{
    protected $table = 'documentos_institucion';
    protected $primaryKey = 'id_documento';
    public $timestamps = false;

    protected $fillable = [
        'id_institucion',
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

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion', 'id_institucion');
    }
}
