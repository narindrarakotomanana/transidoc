import React from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <h1>Dashboard</h1>

            <p>
                Bienvenue dans votre application de gestion des dossiers.
            </p>
        </AuthenticatedLayout>
    );
}