<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Navire extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
    ];

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }
}