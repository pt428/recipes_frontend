import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { AuthModal } from './AuthModal';
import { RecipeCard } from './RecipeCard';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, User, LoginCredentials } from '../types';
import { ChefHat, ArrowUp } from 'lucide-react';
import { RecipeForm } from './RecipeForm';
import { authStorage } from '../services/auth';

interface RecipeListReturnState {
    page: number;
    scrollToId: number;
    activeTab?: 'all' | 'my' | 'favorites';
}

declare global {
    interface Window {
        _pendingScrollTo?: number;
    }
}

export function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'my' | 'favorites'>('all');
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
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<number>>(new Set());
    const favoritesLoadedRef = useRef(false);
    const initialLoadDone = useRef(false);
    const isLoadingRef = useRef(false);

    // ✅ 1. UseEffect: Načti uživatele při startu
    useEffect(() => {
        const token = authStorage.getToken();
        if (token) {
            loadUser();
        }
    }, []);

    // ✅ 2. UseEffect: Zpracování návratu z detailu
    useEffect(() => {
        if (isLoadingRef.current) {
            return;
        }

        const state = location.state as RecipeListReturnState | null;
        const sessionData = sessionStorage.getItem('recipeListReturn_v2');

        if (state?.page || sessionData) {
            let returnPage = 1;
            let scrollToId: number | null = null;
            let returnTab: 'all' | 'my' | 'favorites' = 'all';

            if (state?.page) {
                returnPage = state.page;
                scrollToId = state.scrollToId || null;
                returnTab = state.activeTab || 'all';
            } else if (sessionData) {
                try {
                    const data: RecipeListReturnState = JSON.parse(sessionData);
                    returnPage = data.page || 1;
                    scrollToId = data.scrollToId || null;
                    returnTab = data.activeTab || 'all';
                    sessionStorage.removeItem('recipeListReturn_v2');
                } catch (e) {
                    console.error('Chyba při parsování sessionStorage:', e);
                }
            }

            setActiveTab(returnTab);
            loadRecipesForView(returnTab, returnPage, false);

            if (scrollToId) {
                window._pendingScrollTo = scrollToId;
            }

            window.history.replaceState({}, document.title);
        } else if (!initialLoadDone.current) {
            loadRecipesForView('all', 1, false);
            initialLoadDone.current = true;
        }
    }, [location.key]);

    useEffect(() => {
        const scrollToId = window._pendingScrollTo;

        if (scrollToId && recipes.length > 0 && !loading) {
            setTimeout(() => {
                const element = document.getElementById(`recipe-${scrollToId}`);

                if (element) {
                    element.scrollIntoView({ behavior: 'auto', block: 'center' });
                    element.classList.add('highlight-recipe');
                    setTimeout(() => {
                        element.classList.remove('highlight-recipe');
                    }, 2000);
                }

                delete window._pendingScrollTo;
            }, 300);
        }
    }, [recipes, loading]);

    // ✅ 3. UseEffect: Když se načte user a jsou recepty, načti oblíbené
    useEffect(() => {
        if (user && recipes.length > 0 && !favoritesLoadedRef.current && activeTab !== 'favorites' && !loading) {
            loadFavoriteStatus(recipes);
            favoritesLoadedRef.current = true;
        }
    }, [user, recipes.length, activeTab, loading]);

    // ✅ 4. UseEffect: Sledování scroll pozice pro zobrazení tlačítka "nahoru"
    useEffect(() => {
        const handleScroll = () => {
            // Zobrazit tlačítko po scrollu více než 400px dolů
            setShowScrollTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const loadUser = async (): Promise<User | null> => {
        try {
            const userData = await recipeApi.getCurrentUser();
            setUser(userData);
            return userData;
        } catch (err) {
            console.error('Chyba při načítání uživatele:', err);
            authStorage.removeToken();
            return null;
        }
    };

    const loadRecipes = async (page: number = 1, append: boolean = false): Promise<void> => {
        await loadRecipesForView(activeTab, page, append);
    };

    const loadRecipesForView = async (view: 'all' | 'my' | 'favorites', page: number = 1, append: boolean = false): Promise<void> => {
        if (isLoadingRef.current) {
            return;
        }

        try {
            isLoadingRef.current = true;

            if (append) {
                setIsLoadingMore(true);
            } else {
                setLoading(true);
                favoritesLoadedRef.current = false;
            }

            let data;
            if (view === 'favorites') {
                data = await recipeApi.getFavoriteRecipes(page, recipesPerPage);
            } else {
                data = await recipeApi.getRecipes(page, recipesPerPage);
            }

            // ✅ Klíčová změna: append místo replace
            if (append) {
                setRecipes(prev => [...prev, ...data.recipes]);
            } else {
                setRecipes(data.recipes);
            }

            setTotalPages(data.totalPages);
            setTotalRecipes(data.total);
            setCurrentPage(page);
            setError(null);

            if (user && view !== 'favorites') {
                await loadFavoriteStatus(data.recipes);
                favoritesLoadedRef.current = true;
            } else if (view === 'favorites') {
                const ids = new Set(data.recipes.map(r => r.id));
                setFavoriteRecipeIds(prev => {
                    if (append) {
                        return new Set([...prev, ...ids]);
                    }
                    return ids;
                });
            }
        } catch (err) {
            console.error('❌ Chyba při načítání:', err);
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst recepty');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
            isLoadingRef.current = false;
        }
    };

    const loadFavoriteStatus = async (recipesToCheck: Recipe[]) => {
        if (!user) {
            setFavoriteRecipeIds(new Set());
            return;
        }

        try {
            const favoritesData = await recipeApi.getFavoriteRecipes(1, 100);
            const allFavoriteIds = new Set(favoritesData.recipes.map(r => r.id));
            setFavoriteRecipeIds(allFavoriteIds);
        } catch (err) {
            console.error('❌ Chyba při načítání stavu oblíbených:', err);
            try {
                const checks = await Promise.all(
                    recipesToCheck.slice(0, 12).map(recipe =>
                        recipeApi.checkFavoriteStatus(recipe.id)
                            .catch(() => ({ recipe_id: recipe.id, is_favorite: false }))
                    )
                );

                const favoriteIds = new Set(
                    checks
                        .filter(check => check.is_favorite)
                        .map(check => check.recipe_id)
                );

                setFavoriteRecipeIds(favoriteIds);
            } catch (fallbackErr) {
                console.error('❌ Fallback také selhal:', fallbackErr);
            }
        }
    };

    const handleFavoriteChange = (recipeId: number, isFavorite: boolean) => {
        setFavoriteRecipeIds(prev => {
            const newSet = new Set(prev);
            if (isFavorite) {
                newSet.add(recipeId);
            } else {
                newSet.delete(recipeId);

                if (activeTab === 'favorites') {
                    setRecipes(prev => prev.filter(r => r.id !== recipeId));
                    setTotalRecipes(prev => prev - 1);
                }
            }
            return newSet;
        });
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
        loadRecipes(1, false);
        setShowRecipeForm(false);
        setEditingRecipe(undefined);
    };

    const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
        // eslint-disable-next-line no-useless-catch
        try {
            const response = await recipeApi.login(credentials);
            authStorage.setToken(response.token);
            setUser(response.user);
            setShowAuthModal(false);

            if (authContext === 'create-recipe') {
                setShowRecipeForm(true);
            }
            setAuthContext('default');
            loadRecipes(1, false);
        } catch (err: unknown) {
            throw err;
        }
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await recipeApi.logout();
        } catch (err) {
            console.error('Chyba při odhlášení:', err);
        } finally {
            authStorage.removeToken();
            setUser(null);
            setFavoriteRecipeIds(new Set());
            loadRecipes(1, false);
            navigate('/');
        }
    };

    const handleSearch = async (query: string, tagIds?: number[], categoryId?: number | null): Promise<void> => {
        setCurrentSearchQuery(query);
        setCurrentSearchTags(tagIds || []);
        setCurrentSearchCategory(categoryId ?? null);

        if (!query.trim() && (!tagIds || tagIds.length === 0) && !categoryId) {
            loadRecipes(1, false);
            return;
        }

        try {
            setLoading(true);
            const data = await recipeApi.searchRecipes(query, tagIds, categoryId, 1, recipesPerPage);
            setRecipes(data.recipes);
            setTotalPages(data.totalPages);
            setTotalRecipes(data.total);
            setCurrentPage(1);

            if (user) {
                await loadFavoriteStatus(data.recipes);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Chyba při vyhledávání');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Nová funkce pro načítání dalších receptů
    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;

        if (currentSearchQuery || currentSearchTags.length > 0 || currentSearchCategory) {
            try {
                setIsLoadingMore(true);
                const data = await recipeApi.searchRecipes(
                    currentSearchQuery,
                    currentSearchTags,
                    currentSearchCategory,
                    nextPage,
                    recipesPerPage
                );

                setRecipes(prev => [...prev, ...data.recipes]);
                setTotalPages(data.totalPages);
                setTotalRecipes(data.total);
                setCurrentPage(nextPage);

                if (user) {
                    await loadFavoriteStatus(data.recipes);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Chyba při načítání dalších receptů');
            } finally {
                setIsLoadingMore(false);
            }
        } else {
            loadRecipes(nextPage, true);
        }
    };

    const handleRecipeClick = (recipeId: number) => {
        const returnState: RecipeListReturnState = {
            page: currentPage,
            scrollToId: recipeId,
            activeTab: activeTab
        };

        sessionStorage.setItem('recipeListReturn_v2', JSON.stringify(returnState));

        navigate(`/${recipeId}`, {
            state: returnState
        });
    };

    const handleViewChange = (view: 'all' | 'my' | 'favorites') => {
        setActiveTab(view);
        setCurrentPage(1);
        setCurrentSearchQuery('');
        setCurrentSearchTags([]);
        setCurrentSearchCategory(null);
        favoritesLoadedRef.current = false;

        loadRecipesForView(view, 1, false);
    };

    const filteredRecipes: Recipe[] = (recipes || []).filter(recipe => {
        if (activeTab === 'my' && user) {
            return recipe.user_id === user.id;
        }
        if (activeTab === 'favorites') {
            return true;
        }
        return true;
    });

    const hasMore = currentPage < totalPages;

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
                onViewChange={handleViewChange}
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
                            onClick={() => {
                                navigate('/recepty?page=1');
                                loadRecipes(1, false);
                            }}
                            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl"
                        >
                            Zkusit znovu
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecipes.map(recipe => {
                                const isFav = favoriteRecipeIds.has(recipe.id);
                                return (
                                    <div key={recipe.id} id={`recipe-${recipe.id}`}>
                                        <RecipeCard
                                            recipe={recipe}
                                            onClick={() => handleRecipeClick(recipe.id)}
                                            currentUser={user}
                                            isFavorite={isFav}
                                            onFavoriteChange={handleFavoriteChange}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ Info o zobrazených receptech */}
                        <div className="text-center mt-6 mb-4">
                            <p className="text-sm text-gray-600">
                                Zobrazeno {recipes.length} z {totalRecipes} receptů
                            </p>
                        </div>

                        {/* ✅ Tlačítko "Načíst další" místo stránkování */}
                        {hasMore && (
                            <div className="flex justify-center mt-8 mb-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500 flex items-center gap-2"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Načítání...</span>
                                        </>
                                    ) : (
                                        <span>Načíst další recepty</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!loading && !error && filteredRecipes.length === 0 && (
                    <div className="text-center py-20">
                        <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">
                            {activeTab === 'favorites'
                                ? 'Zatím nemáte žádné oblíbené recepty'
                                : 'Žádné recepty nenalezeny'}
                        </p>
                    </div>
                )}
            </div>

            {/* ✅ Tlačítko scroll nahoru */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
                    aria-label="Scrollovat nahoru"
                >
                    <ArrowUp className="w-6 h-6 group-hover:transform group-hover:-translate-y-1 transition-transform duration-200" />
                </button>
            )}
        </div>
    );
}