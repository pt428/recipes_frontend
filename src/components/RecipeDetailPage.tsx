//frontend\src\components\RecipeDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RecipeDetail } from './RecipeDetail';
import { RecipeForm } from './RecipeForm';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, User } from '../types';
import { authStorage } from '../services/auth';

interface RecipeListReturnState {
    page: number;
    scrollToId: number;
}

export function RecipeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);

    useEffect(() => {
        const token = authStorage.getToken();
        if (token) {
            loadUser();
        }
        if (id) {
            loadRecipe(parseInt(id));
        }
    }, [id]);

    const loadUser = async () => {
        try {
            const userData = await recipeApi.getCurrentUser();
            setUser(userData);
        } catch (err) {
            console.error('Chyba při načítání uživatele:', err);
            authStorage.removeToken();
        }
    };

    const loadRecipe = async (recipeId: number) => {
        try {
            setLoading(true);
            const recipeData = await recipeApi.getRecipe(recipeId);
            setRecipe(recipeData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst recept');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        // Získáme parametry z location.state
        const state = location.state as RecipeListReturnState | null;
        const returnPage = state?.page || 1;
        const scrollToId = state?.scrollToId || (id ? parseInt(id) : 0);

        console.log('⬅️ Navigace zpět:', { returnPage, scrollToId });

        // Vrátíme se na HomePage s state
        const returnState: RecipeListReturnState = {
            page: returnPage,
            scrollToId: scrollToId
        };

        navigate('/recepty', { state: returnState });
    };

    const handleEdit = () => {
        setShowEditForm(true);
    };

    const handleDelete = async (recipeId: number) => {
        try {
            await recipeApi.deleteRecipe(recipeId);
            const state = location.state as RecipeListReturnState | null;
            const returnPage = state?.page || 1;

            const returnState: RecipeListReturnState = {
                page: returnPage,
                scrollToId: 0 // Po smazání nescrollujeme
            };

            navigate('/recepty', { state: returnState });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nepodařilo se smazat recept');
        }
    };

    const handleRecipeUpdate = async () => {
        if (id) {
            await loadRecipe(parseInt(id));
        }
    };

    const handleFormSuccess = () => {
        setShowEditForm(false);
        if (id) {
            loadRecipe(parseInt(id));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Načítání receptu...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center py-20">
                    <p className="text-red-500 text-xl">{error || 'Recept nenalezen'}</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl"
                    >
                        Zpět na seznam
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {showEditForm && (
                <RecipeForm
                    recipe={recipe}
                    onClose={() => setShowEditForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
            <RecipeDetail
                recipe={recipe}
                onBack={handleBack}
                onEdit={handleEdit}
                onDelete={handleDelete}
                currentUser={user}
                onRecipeUpdate={handleRecipeUpdate}
            />
        </>
    );
}