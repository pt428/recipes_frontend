import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeApi } from '../api/recipeApi';
import type { Recipe } from '../types';
import { RecipeDetail } from './RecipeDetail';

/**
 * ✅ Komponenta pro zobrazení receptu pomocí sdíleného odkazu
 * URL: /shared/:token
 */
export const SharedRecipe: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Chybí token sdíleného odkazu');
            setLoading(false);
            return;
        }

        loadRecipe();
    }, [token]);

    const loadRecipe = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await recipeApi.getRecipeByShareToken(token!);
            setRecipe(data);
        } catch (err) {
            console.error('Chyba při načítání sdíleného receptu:', err);
            setError('Recept nebyl nalezen nebo odkaz vypršel.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Načítám recept...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Recept nenalezen</h2>
                    <p className="text-gray-600 mb-6">{error || 'Tento odkaz je neplatný nebo vypršel.'}</p>
                    <button
                        onClick={() => navigate('/recepty')}
                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    >
                        Přejít na hlavní stránku
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Použijeme stejnou komponentu RecipeDetail, ale bez možnosti editace
    // Pro sdílené recepty: currentUser=null, takže se nezobrazí tlačítka pro úpravy
    return (
        <RecipeDetail
            recipe={recipe}
            onBack={() => navigate('/recepty')}
            onEdit={() => { }} // Prázdná funkce - nikdy se nezavolá (není zobrazeno tlačítko)
            onDelete={async () => { }} // Prázdná funkce - nikdy se nezavolá
            currentUser={null} // ✅ DŮLEŽITÉ: null = nezobrazí se tlačítka pro úpravy
        />
    );
};