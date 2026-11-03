<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DossierController extends Controller
{
    /**
     * Afficher la liste des dossiers.
     */
    public function index(Request $request): Response
    {
        $query = Dossier::query()
            ->with([
                'client:id,nom',
                'navire:id,nom',
            ]);

        // Recherche par numéro BL, client ou navire.
        if ($request->filled('search')) {
            $search = trim($request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('numero_bl', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($clientQuery) use ($search) {
                        $clientQuery->where('nom', 'like', "%{$search}%");
                    })
                    ->orWhereHas('navire', function ($navireQuery) use ($search) {
                        $navireQuery->where('nom', 'like', "%{$search}%");
                    });
            });
        }


        // Si une année ou un mois est sélectionné,appliquer les filtres demandés par l'utilisateur.
        if ($request->filled('annee')) {
            $query->whereYear('date_dossier', $request->input('annee'));
        }

        if ($request->filled('mois')) {
            $query->whereMonth('date_dossier', $request->input('mois'));
        }


        // Appliquer une période par défaut uniquement si l'utilisateur n'a sélectionné aucun filtre de date.
        if (
            !$request->filled('search')
            && !$request->filled('annee')
            && !$request->filled('mois')
        ) {
            $dateFin = now()->toDateString();
            $dateDebut = now()->subMonths(12)->toDateString();

            // Vérifier s'il existe au moins un dossier dans les 12 derniers mois.
            $dossiersRecentsExistants = Dossier::query()
                ->whereBetween('date_dossier', [$dateDebut, $dateFin])
                ->exists();

            // S'il existe des dossiers récents, limiter la liste aux 12 derniers mois.
            // Sinon, conserver tous les dossiers pour afficher les plus récents disponibles.
            if ($dossiersRecentsExistants) {
                $query->whereBetween('date_dossier', [
                    $dateDebut,
                    $dateFin,
                ]);
            }
        }



        $dossiers = $query
            ->orderByDesc('date_dossier')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function (Dossier $dossier) {
                return [
                    'id' => $dossier->id,
                    'date_dossier' => $dossier->date_dossier?->format('Y-m-d'),
                    'numero_bl' => $dossier->numero_bl,
                    'client' => $dossier->client?->nom,
                    'navire' => $dossier->navire?->nom,
                    'date_importation' => $dossier->date_importation?->format('Y-m-d H:i:s'),
                    'documents_count' => $dossier->documents()->count(),
                ];
            });

        return Inertia::render('Dossiers/Index', [
            'dossiers' => $dossiers,
            'filters' => [
                'search' => $request->input('search', ''),
                'annee' => $request->input('annee', ''),
                'mois' => $request->input('mois', ''),
            ],
                ]);
    }

    /**
     * Afficher les détails d'un dossier.
     */
    public function show(Dossier $dossier): Response
    {
        $dossier->load([
            'client:id,nom',
            'navire:id,nom',
            'documents:id,dossier_id,type,nom_original,chemin,created_at',
        ]);

        return Inertia::render('Dossiers/Show', [
            'dossier' => [
                'id' => $dossier->id,
                'date_dossier' => $dossier->date_dossier?->format('Y-m-d'),
                'numero_bl' => $dossier->numero_bl,
                'client' => $dossier->client?->nom,
                'navire' => $dossier->navire?->nom,
                'date_importation' => $dossier->date_importation?->format('Y-m-d H:i:s'),

                'documents' => $dossier->documents->map(function ($document) {
                    return [
                        'id' => $document->id,
                        'type' => $document->type,
                        'nom_original' => $document->nom_original,
                        'chemin' => $document->chemin,
                        'date_ajout' => $document->created_at?->format('Y-m-d H:i:s'),
                    ];
                })->values(),
            ],
        ]);
    }
        /**
     * Ajouter des documents à un dossier existant.
     */
    public function storeDocuments(Request $request,Dossier $dossier): RedirectResponse {
        $validated = $request->validate([
            'documents' => ['required', 'array', 'min:1'],
            'documents.*.file' => [
                'required',
                'file',
                'max:51200',
            ],
            'documents.*.type' => [
                'required',
                'string',
                'in:Reçu,Facture,Attestation,BL,Bon de sortie,Déclaration,Valeur MIDAC,Carte grise,Modèle,À identifier,Autre',
            ],
        ]);

        $storedPaths = [];

        try {
            DB::transaction(function () use (
                $validated,
                $dossier,
                &$storedPaths
            ) {
                foreach ($validated['documents'] as $documentData) {
                    $file = $documentData['file'];

                    $path = $file->store(
                        "dossiers/{$dossier->id}",
                        'public'
                    );

                    if ($path === false) {
                        throw new \RuntimeException(
                            "Impossible d'enregistrer un fichier."
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
            if (!empty($storedPaths)) {
                Storage::disk('public')->delete($storedPaths);
            }

            report($exception);

            return back()->withErrors([
                'documents' => "L'ajout des documents a échoué. Veuillez réessayer.",
            ]);
        }

        return redirect()
            ->route('dossiers.show', $dossier->id)
            ->with('success', 'Les documents ont été ajoutés avec succès.');
    }
}
    


