//frontend\src\components\HomePage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { AuthModal } from './AuthModal';
import { RecipeCard } from './RecipeCard';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, User, LoginCredentials } from '../types';
import { ChefHat, ChevronLeft, ChevronRight } from 'lucide-react';
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

    const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<number>>(new Set());
    const favoritesLoadedRef = useRef(false);
    const initialLoadDone = useRef(false);
    const isLoadingRef = useRef(false); // ✅ NOVÉ: Prevence duplicitních načtení

    // ✅ 1. UseEffect: Načti uživatele při startu
    useEffect(() => {
        const token = authStorage.getToken();
        if (token) {
            loadUser();
        }
    }, []);

    // ✅ 2. UseEffect: Zpracování návratu z detailu
    useEffect(() => {
        // Zamezení duplicitním načtením
        if (isLoadingRef.current) {
            // console.log('⚠️ Načítání již probíhá, přeskakuji...');
            return;
        }

        const state = location.state as RecipeListReturnState | null;
        const sessionData = sessionStorage.getItem('recipeListReturn_v2');

        // console.log('🔍 Location state:', state);
        // console.log('🔍 Session data:', sessionData);
        // console.log('🔍 Aktuální activeTab:', activeTab);

        if (state?.page || sessionData) {
            // Návrat z detailu
            let returnPage = 1;
            let scrollToId: number | null = null;
            let returnTab: 'all' | 'my' | 'favorites' = 'all';

            if (state?.page) {
                returnPage = state.page;
                scrollToId = state.scrollToId || null;
                returnTab = state.activeTab || 'all';
                // console.log('📌 Obnovuji z location.state:', { returnPage, scrollToId, returnTab });
            } else if (sessionData) {
                try {
                    const data: RecipeListReturnState = JSON.parse(sessionData);
                    returnPage = data.page || 1;
                    scrollToId = data.scrollToId || null;
                    returnTab = data.activeTab || 'all';
                    sessionStorage.removeItem('recipeListReturn_v2');
                    // console.log('📌 Obnovuji ze sessionStorage:', { returnPage, scrollToId, returnTab });
                } catch (e) {
                    console.error('Chyba při parsování sessionStorage:', e);
                }
            }

            // console.log('✅ Nastavuji activeTab na:', returnTab);
            setActiveTab(returnTab);

            // console.log('✅ Volám loadRecipesForView s:', { view: returnTab, page: returnPage });
            loadRecipesForView(returnTab, returnPage);

            if (scrollToId) {
                window._pendingScrollTo = scrollToId;
            }

            // Vyčistit state po zpracování
            window.history.replaceState({}, document.title);
        } else if (!initialLoadDone.current) {
            // První načtení - bez uloženého stavu
            // console.log('📌 První načtení - načítám všechny recepty');
            loadRecipesForView('all', 1);
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

    // ✅ 3. UseEffect: Když se načte user a jsou recepty, načti oblíbené (jen jednou)
    useEffect(() => {
        if (user && recipes.length > 0 && !favoritesLoadedRef.current && activeTab !== 'favorites' && !loading) {
            // console.log('📌 User je načten, načítám stav oblíbených poprvé...');
            loadFavoriteStatus(recipes);
            favoritesLoadedRef.current = true;
        }
    }, [user, recipes.length, activeTab, loading]);

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

    const loadRecipes = async (page: number = 1): Promise<void> => {
        await loadRecipesForView(activeTab, page);
    };

    const loadRecipesForView = async (view: 'all' | 'my' | 'favorites', page: number = 1): Promise<void> => {
        // ✅ Zamezení duplicitním voláním
        if (isLoadingRef.current) {
            // console.warn('⚠️ Načítání již probíhá, přeskakuji duplicitní volání');
            return;
        }

        try {
            isLoadingRef.current = true;
            setLoading(true);
            favoritesLoadedRef.current = false;

            // console.log(`📌 === ZAČÁTEK NAČÍTÁNÍ ===`);
            // console.log(`📌 Načítám recepty: view=${view}, page=${page}`);

            let data;
            if (view === 'favorites') {
               
                data = await recipeApi.getFavoriteRecipes(page, recipesPerPage);
            
            } else {
                 
                data = await recipeApi.getRecipes(page, recipesPerPage);
                
            }
 
            setRecipes(data.recipes);
            setTotalPages(data.totalPages);
            setTotalRecipes(data.total);
            setCurrentPage(page);
            setError(null);
          

            if (user && view !== 'favorites') {
                 
                await loadFavoriteStatus(data.recipes);
                favoritesLoadedRef.current = true;
            } else if (view === 'favorites') {
                const ids = new Set(data.recipes.map(r => r.id));
                
                setFavoriteRecipeIds(ids);
            }

            
        } catch (err) {
            console.error('❌ Chyba při načítání:', err);
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst recepty');
        } finally {
            setLoading(false);
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
        loadRecipes(currentPage);
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
            loadRecipes(currentPage);
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
            loadRecipes(1);
            navigate('/');
        }
    };

    const handleSearch = async (query: string, tagIds?: number[], categoryId?: number | null): Promise<void> => {
        setCurrentSearchQuery(query);
        setCurrentSearchTags(tagIds || []);
        setCurrentSearchCategory(categoryId ?? null);

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

    const handlePageChange = async (page: number) => {
        if (page < 1 || page > totalPages) return;

        window.scrollTo({ top: 0, behavior: 'smooth' });

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

                if (user) {
                    await loadFavoriteStatus(data.recipes);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Chyba při načítání stránky');
            } finally {
                setLoading(false);
            }
        } else {
            loadRecipes(page);
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

        loadRecipesForView(view, 1);
    };

    const filteredRecipes: Recipe[] = (recipes || []).filter(recipe => {
        if (activeTab === 'my' && user) {
            return recipe.user_id === user.id;
        }
        if (activeTab === 'favorites') {
            return true; // API už vrací jen oblíbené
        }
        return true;
    });

    
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
                                loadRecipes(1);
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

                        <div className="text-center mt-6 mb-4">
                            <p className="text-sm text-gray-600">
                                Zobrazeno {((currentPage - 1) * recipesPerPage) + 1}–{Math.min(currentPage * recipesPerPage, totalRecipes)} z {totalRecipes} receptů
                            </p>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white"
                                    aria-label="Předchozí stránka"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {(() => {
                                    const pages = [];
                                    const showPages = 5;
                                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                                    const endPage = Math.min(totalPages, startPage + showPages - 1);

                                    if (endPage - startPage < showPages - 1) {
                                        startPage = Math.max(1, endPage - showPages + 1);
                                    }

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
                        <p className="text-xl text-gray-500">
                            {activeTab === 'favorites'
                                ? 'Zatím nemáte žádné oblíbené recepty'
                                : 'Žádné recepty nenalezeny'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}