<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use Illuminate\Http\Request;
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

        // Filtrer par année du dossier.
        if ($request->filled('annee')) {
            $query->whereYear('date_dossier', $request->input('annee'));
        }

        // Filtrer par mois du dossier.
        if ($request->filled('mois')) {
            $query->whereMonth('date_dossier', $request->input('mois'));
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
}

