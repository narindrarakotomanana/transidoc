<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Navire;
use App\Models\Dossier;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ImportDossierController extends Controller
{
    /**
     * Afficher la page d'importation des dossiers.
     */
    public function create(): Response
    {
        return Inertia::render('Import/ImportDossier', [
            'clients' => Client::query()
                ->orderBy('nom')
                ->get(['id', 'nom']),

            'navires' => Navire::query()
                ->orderBy('nom')
                ->get(['id', 'nom']),
        ]);
    }

    /**
     * Enregistrer un dossier et ses documents.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date_dossier' => ['required', 'date'],
            'numero_bl' => ['required', 'string', 'max:255'],
            'client' => ['required', 'string', 'max:255'],
            'navire' => ['required', 'string', 'max:255'],

            'documents' => ['required', 'array', 'min:1'],
            'documents.*.file' => [
                'required',
                'file',
                'max:51200',
            ],
            'documents.*.type' => [
                'required',
                'string',
                'max:100',
            ],
        ]);

        $clientNom = trim($validated['client']);
        $navireNom = trim($validated['navire']);

        if ($clientNom === '' || $navireNom === '') {
            return back()->withErrors([
                'client' => 'Le client est obligatoire.',
                'navire' => 'Le navire est obligatoire.',
            ]);
        }

        $storedPaths = [];

        try {
            DB::transaction(function () use (
                $validated,
                $clientNom,
                $navireNom,
                &$storedPaths
            ) {
                // Retrouver ou créer automatiquement le client.
                $client = Client::firstOrCreate([
                    'nom' => $clientNom,
                ]);

                // Retrouver ou créer automatiquement le navire.
                $navire = Navire::firstOrCreate([
                    'nom' => $navireNom,
                ]);

                // Créer le dossier.
                $dossier = Dossier::create([
                    'date_dossier' => $validated['date_dossier'],
                    'numero_bl' => trim($validated['numero_bl']),
                    'client_id' => $client->id,
                    'navire_id' => $navire->id,
                    'date_importation' => now(),
                ]);

                // Enregistrer chaque document.
                foreach ($validated['documents'] as $documentData) {
                    $file = $documentData['file'];

                    $path = $file->store(
                        "dossiers/{$dossier->id}",
                        'public'
                    );

                    if ($path === false) {
                        throw new \RuntimeException(
                            "Impossible d'enregistrer le fichier."
                        );
                    }

                    $storedPaths[] = $path;

                    Document::create([
                        'dossier_id' => $dossier->id,
                        'type' => $documentData['type'],
                        'nom_original' => $file->getClientOriginalName(),
                        'chemin' => $path,
                    ]);
                }
            });
        } catch (\Throwable $exception) {
            // Supprimer les fichiers si l'enregistrement échoue.
            if (!empty($storedPaths)) {
                Storage::disk('public')->delete($storedPaths);
            }

            report($exception);

            return back()->withErrors([
                'importation' => "L'importation a échoué. Aucun dossier n'a été confirmé.",
            ]);
        }

        return redirect()
            ->route('import.dossier')
            ->with('success', 'Le dossier et ses documents ont été enregistrés.');
    }
}