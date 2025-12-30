//frontend\src\components\HomePage.tsx
import { useState, useEffect } from 'react';
import { Header } from './Header';
import { AuthModal } from './AuthModal';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, User, LoginCredentials } from '../types';
import { ChefHat, ChevronLeft, ChevronRight } from 'lucide-react';
import { RecipeForm } from './RecipeForm';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../services/auth';

export function HomePage() {
    const navigate = useNavigate();
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecipes, setTotalRecipes] = useState(0);
    const [recipesPerPage] = useState(12);
    const [currentSearchQuery, setCurrentSearchQuery] = useState('');
    const [currentSearchTags, setCurrentSearchTags] = useState<number[]>([]);
    const [currentSearchCategory, setCurrentSearchCategory] = useState<number | null>(null);
    // Detekce tlačítka zpět pro zavření detailu receptu
    useEffect(() => {
        if (selectedRecipe) {
            // Přidáme fake historii, aby zpět fungovalo
            window.history.pushState({ recipeDetail: true }, '');

            const handlePopState = (event: PopStateEvent) => {
                if (event.state?.recipeDetail || selectedRecipe) {
                    setSelectedRecipe(null);
                }
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [selectedRecipe]);
    
    useEffect(() => {
        const token = authStorage.getToken();
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
            authStorage.removeToken();
        }
    };

    const loadRecipes = async (page: number = 1): Promise<void> => {
        try {
            setLoading(true);
            const data = await recipeApi.getRecipes(page, recipesPerPage);

            // console.log('Loaded recipes data:', data); // DEBUG
            // console.log('Total pages:', data.totalPages); // DEBUG
            // console.log('Total recipes:', data.total); // DEBUG

            setRecipes(data.recipes);
            setTotalPages(data.totalPages);
            setTotalRecipes(data.total);
            setCurrentPage(page);
            setError(null);

            // Scroll to top when changing pages
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        loadRecipes(currentPage);
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

    const handleRecipeUpdate = async () => {
        if (selectedRecipe) {
            try {
                const updatedRecipe = await recipeApi.getRecipe(selectedRecipe.id);
                setSelectedRecipe(updatedRecipe);
                loadRecipes();
            } catch (err) {
                console.error('Chyba při aktualizaci receptu:', err);
            }
        }
    };

    const handleSearch = async (query: string, tagIds?: number[], categoryId?: number | null): Promise<void> => {
        // Uložíme si aktuální vyhledávací parametry
        setCurrentSearchQuery(query);
        setCurrentSearchTags(tagIds || []);
        setCurrentSearchCategory(categoryId ?? null);

        // Pokud není query, tagy ani kategorie, načteme všechny recepty
        if (!query.trim() && (!tagIds || tagIds.length === 0) && !categoryId) {
            loadRecipes(1);
            return;
        }

        try {
            setLoading(true);
            const data = await recipeApi.searchRecipes(query, tagIds, categoryId, 1, recipesPerPage);
            setRecipes(data.recipes);
            setTotalPages(data.totalPages);
            setTotalRecipes(data.total);
            setCurrentPage(1);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Chyba při vyhledávání');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (page: number) => {
        if (page < 1 || page > totalPages) return;

        // Pokud máme aktivní vyhledávání
        if (currentSearchQuery || currentSearchTags.length > 0 || currentSearchCategory) {
            try {
                setLoading(true);
                const data = await recipeApi.searchRecipes(
                    currentSearchQuery,
                    currentSearchTags,
                    currentSearchCategory,
                    page,
                    recipesPerPage
                );
                setRecipes(data.recipes);
                setTotalPages(data.totalPages);
                setTotalRecipes(data.total);
                setCurrentPage(page);

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Chyba při načítání stránky');
            } finally {
                setLoading(false);
            }
        } else {
            loadRecipes(page);
        }
    };

    const handleLogin = async (credentials: LoginCredentials) => {
        const data = await recipeApi.login(credentials);
        authStorage.setToken(data.token);
        setUser(data.user);
        loadRecipes();
    };

    const handleLogout = async () => {
        try {
            await recipeApi.logout();
        } catch (err) {
            console.error(err);
        } finally {
            authStorage.removeToken();
            setUser(null);
            loadRecipes();
        }
    };

    // const handleRecipeClick = async (recipeId: number) => {
    //     try {
    //         setLoading(true);
    //         const recipe = await recipeApi.getRecipe(recipeId);
    //         setSelectedRecipe(recipe);
    //     } catch (err) {
    //         setError(err instanceof Error ? err.message : 'Nepodařilo se načíst detail receptu');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleRecipeClick = (recipeId: number) => {
        navigate(`/recepty/${recipeId}`);
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
                onRecipeUpdate={handleRecipeUpdate}
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
                onViewChange={(view) => setActiveTab(view === 'my' ? 'my' : 'all')}
                onCreateRecipe={handleCreateRecipe}
                activeView={activeTab}
            />

            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Načítání receptů...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500 text-xl">{error}</p>
                        <button
                            onClick={() => loadRecipes(1)}
                            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl"
                        >
                            Zkusit znovu
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => handleRecipeClick(recipe.id)}
                                    currentUser={user}
                                />
                            ))}
                        </div>

                        {/* Info o stránkování */}
                        <div className="text-center mt-6 mb-4">
                            <p className="text-sm text-gray-600">
                                Zobrazeno {((currentPage - 1) * recipesPerPage) + 1}–{Math.min(currentPage * recipesPerPage, totalRecipes)} z {totalRecipes} receptů
                            </p>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                {/* Previous button */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white"
                                    aria-label="Předchozí stránka"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {/* Page numbers */}
                                {(() => {
                                    const pages = [];
                                    const showPages = 5; // Počet viditelných tlačítek
                                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                                    const endPage = Math.min(totalPages, startPage + showPages - 1);

                                    // Adjust start if we're near the end
                                    if (endPage - startPage < showPages - 1) {
                                        startPage = Math.max(1, endPage - showPages + 1);
                                    }

                                    // First page + ellipsis
                                    if (startPage > 1) {
                                        pages.push(
                                            <button
                                                key={1}
                                                onClick={() => handlePageChange(1)}
                                                className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                            >
                                                1
                                            </button>
                                        );
                                        if (startPage > 2) {
                                            pages.push(
                                                <span key="ellipsis-start" className="px-2 text-gray-500">...</span>
                                            );
                                        }
                                    }

                                    // Page numbers
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${currentPage === i
                                                    ? 'bg-orange-500 border-orange-500 text-white font-semibold'
                                                    : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }

                                    // Ellipsis + last page
                                    if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) {
                                            pages.push(
                                                <span key="ellipsis-end" className="px-2 text-gray-500">...</span>
                                            );
                                        }
                                        pages.push(
                                            <button
                                                key={totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                                className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                            >
                                                {totalPages}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}

                                {/* Next button */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white"
                                    aria-label="Další stránka"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
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