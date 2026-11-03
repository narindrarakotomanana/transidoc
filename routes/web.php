<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ImportDossierController;
use App\Http\Controllers\DossierController;

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::get('/importer-dossier', [ImportDossierController::class, 'create'])
    ->name('import.dossier');

Route::post('/importer-dossier', [ImportDossierController::class, 'store'])
    ->name('import.dossier.store');

Route::get('/dossiers', [DossierController::class, 'index'])
    ->name('dossiers.index');

Route::get('/dossiers/{dossier}', [DossierController::class, 'show'])
    ->name('dossiers.show');

Route::post('/dossiers/{dossier}/documents', [
    DossierController::class,
    'storeDocuments',
])->name('dossiers.documents.store');