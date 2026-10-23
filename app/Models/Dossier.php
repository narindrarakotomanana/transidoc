<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dossier extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_dossier',
        'numero_bl',
        'client_id',
        'navire_id',
        'date_importation',
    ];

    protected function casts(): array
    {
        return [
            'date_dossier' => 'date',
            'date_importation' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function navire(): BelongsTo
    {
        return $this->belongsTo(Navire::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}