//frontend\src\components\HomePage.tsx
import  { useState, useEffect } from 'react';
import { Header } from './Header';
import { AuthModal } from './AuthModal';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, User, LoginCredentials } from '../types';
import { ChefHat, Plus } from 'lucide-react';
import { RecipeForm } from './RecipeForm';

export function HomePage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [showRecipeForm, setShowRecipeForm] = useState<boolean>(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
    const [authContext, setAuthContext] = useState<'default' | 'create-recipe'>('default');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        }
        loadRecipes();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await recipeApi.getCurrentUser();
            setUser(userData);
        } catch (err) {
            console.error('Chyba při načítání uživatele:', err);
            localStorage.removeItem('token');
        }
    };

    const loadRecipes = async (): Promise<void> => {
        try {
            setLoading(true);
            const recipes = await recipeApi.getRecipes();
            setRecipes(recipes);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst recepty');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRecipe = (): void => {
        if (!user) {
            setAuthContext('create-recipe');
            setShowAuthModal(true);
            return;
        }
        setEditingRecipe(undefined);
        setShowRecipeForm(true);
    };

    const handleRecipeFormSuccess = (): void => {
        loadRecipes();
        setShowRecipeForm(false);
        setEditingRecipe(undefined);
    };

    const handleEditRecipe = (recipe: Recipe): void => {
        setEditingRecipe(recipe);
        setShowRecipeForm(true);
        setSelectedRecipe(null);
    };

    const handleDeleteRecipe = async (recipeId: number): Promise<void> => {
        try {
            await recipeApi.deleteRecipe(recipeId);
            setSelectedRecipe(null);
            loadRecipes();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Nepodařilo se smazat recept');
        }
    };

    // ✅ NOVÉ: Callback pro aktualizaci receptu po změně sdílení
    const handleRecipeUpdate = async () => {
        if (selectedRecipe) {
            try {
                const updatedRecipe = await recipeApi.getRecipe(selectedRecipe.id);
                setSelectedRecipe(updatedRecipe);
                // Aktualizujeme také seznam receptů
                loadRecipes();
            } catch (err) {
                console.error('Chyba při aktualizaci receptu:', err);
            }
        }
    };

    const handleSearch = async (query: string): Promise<void> => {
        if (!query.trim()) {
            loadRecipes();
            return;
        }

        try {
            setLoading(true);
            const recipes = await recipeApi.searchRecipes(query);
            setRecipes(recipes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Chyba při vyhledávání');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (credentials: LoginCredentials) => {
        const data = await recipeApi.login(credentials);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        loadRecipes();
    };

    const handleLogout = async () => {
        try {
            await recipeApi.logout();
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            loadRecipes();
        }
    };

    const handleRecipeClick = async (recipeId: number) => {
        try {
            setLoading(true);
            const recipe = await recipeApi.getRecipe(recipeId);
            setSelectedRecipe(recipe);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst detail receptu');
        } finally {
            setLoading(false);
        }
    };

    const filteredRecipes: Recipe[] = (recipes || []).filter(recipe => {
        if (activeTab === 'my' && user) {
            return recipe.user_id === user.id;
        }
        return true;
    });

    if (selectedRecipe) {
        return (
            <RecipeDetail
                recipe={selectedRecipe}
                currentUser={user}
                onBack={() => setSelectedRecipe(null)}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteRecipe}
                onRecipeUpdate={handleRecipeUpdate} // ✅ PŘIDÁNO
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {showRecipeForm && (
                <RecipeForm
                    recipe={editingRecipe}
                    onClose={() => {
                        setShowRecipeForm(false);
                        setEditingRecipe(undefined);
                    }}
                    onSuccess={handleRecipeFormSuccess}
                />
            )}
            {showAuthModal && (
                <AuthModal
                    onClose={() => {
                        setShowAuthModal(false);
                        setAuthContext('default');
                    }}
                    onLogin={handleLogin}
                    context={authContext}
                />
            )}

            <Header
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogoutClick={handleLogout}
                onSearch={handleSearch}
            />

            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${activeTab === 'all'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Všechny recepty
                    </button>
                    {user && (
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${activeTab === 'my'
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Moje recepty
                        </button>
                    )}
                    <button
                        onClick={handleCreateRecipe}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-sm sm:text-base sm:ml-auto"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Nový recept
                    </button>
                </div>
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Načítání receptů...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500 text-xl">{error}</p>
                        <button
                            onClick={loadRecipes}
                            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl"
                        >
                            Zkusit znovu
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => handleRecipeClick(recipe.id)}
                                currentUser={user} // ✅ PŘIDÁNO: Předáváme uživatele pro zobrazení visibility
                            />
                        ))}
                    </div>
                )}

                {!loading && !error && filteredRecipes.length === 0 && (
                    <div className="text-center py-20">
                        <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">Žádné recepty nenalezeny</p>
                    </div>
                )}
            </div>
        </div>
    );
}