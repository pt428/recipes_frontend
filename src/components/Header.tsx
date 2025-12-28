//frontend\src\components\Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Search, LogIn, LogOut, User as UserIcon, Settings, Trash2, X, Tag as TagIcon, Plus, Filter } from 'lucide-react';
import type { HeaderProps, Tag, Category } from '../types';
import { recipeApi } from '../api/recipeApi';

export const Header: React.FC<HeaderProps> = ({
    user,
    onLoginClick,
    onLogoutClick,
    onSearch,
    onViewChange,
    onCreateRecipe,
    activeView = 'all'
}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Načtení tagů a kategorií při mounted
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [tags, categories] = await Promise.all([
                    recipeApi.getTags(),
                    recipeApi.getCategories()
                ]);
                setAvailableTags(tags);
                setAvailableCategories(categories);
            } catch (err) {
                console.error('Chyba při načítání filtrů:', err);
            }
        };
        fetchFilters();
    }, []);

    // Zavření menu při kliknutí mimo
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
                setShowTagDropdown(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                // Neklikli na hamburger tlačítko
                const target = event.target as HTMLElement;
                if (!target.closest('[data-sidebar-toggle]')) {
                    setShowSidebar(false);
                }
            }
        };

        if (showUserMenu || showTagDropdown || showCategoryDropdown || showSidebar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, showTagDropdown, showCategoryDropdown, showSidebar]);

    // Spuštění vyhledávání při změně query, tagů nebo kategorie
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch(searchQuery, selectedTags, selectedCategory);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedTags, selectedCategory]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(id => id !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
    };

    const handleRemoveTag = (tagId: number) => {
        setSelectedTags(prev => prev.filter(id => id !== tagId));
    };

    const handleCategorySelect = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        setShowCategoryDropdown(false);
    };

    const handleEditProfile = () => {
        setShowUserMenu(false);
        navigate('/profile/edit');
    };

    const handleDeleteAccount = () => {
        setShowUserMenu(false);
        navigate('/profile/delete');
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedTags([]);
        setSelectedCategory(null);
    };

    const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedCategory !== null;

    return (
        <>
            {/* Sidebar overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg shadow-lg">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Recepty
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => {
                                setShowSidebar(false);
                                onViewChange?.('all');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors group ${activeView === 'all'
                                ? 'bg-orange-500 text-white'
                                : 'hover:bg-orange-50'
                                }`}
                        >
                            <ChefHat className={`w-5 h-5 ${activeView === 'all'
                                ? 'text-white'
                                : 'text-gray-600 group-hover:text-orange-600'
                                }`} />
                            <span className={`font-medium ${activeView === 'all'
                                ? 'text-white font-semibold'
                                : 'text-gray-700 group-hover:text-orange-600'
                                }`}>
                                Všechny recepty
                            </span>
                            {activeView === 'all' && (
                                <svg className="w-4 h-4 ml-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        {user && (
                            <button
                                onClick={() => {
                                    setShowSidebar(false);
                                    onViewChange?.('my');
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors group ${activeView === 'my'
                                    ? 'bg-orange-500 text-white'
                                    : 'hover:bg-orange-50'
                                    }`}
                            >
                                <UserIcon className={`w-5 h-5 ${activeView === 'my'
                                    ? 'text-white'
                                    : 'text-gray-600 group-hover:text-orange-600'
                                    }`} />
                                <span className={`font-medium ${activeView === 'my'
                                    ? 'text-white font-semibold'
                                    : 'text-gray-700 group-hover:text-orange-600'
                                    }`}>
                                    Moje recepty
                                </span>
                                {activeView === 'my' && (
                                    <svg className="w-4 h-4 ml-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {user && (
                            <>
                                <div className="border-t border-gray-200 my-2"></div>
                                <button
                                    onClick={() => {
                                        setShowSidebar(false);
                                        onCreateRecipe?.();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all group"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="font-semibold">Nový recept</span>
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    {/* Main row - všechno na jednom řádku */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Hamburger menu */}
                        <button
                            data-sidebar-toggle
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <div
                            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
                            onClick={() => navigate('/recepty/')}
                        >
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-1.5 sm:p-2 rounded-lg shadow-lg">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="hidden lg:block text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent whitespace-nowrap">
                                Recepty
                            </h1>
                        </div>

                        {/* Search bar */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Hledat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors text-sm"
                            />
                        </div>

                        {/* Category filter */}
                        <div className="relative flex-shrink-0" ref={categoryDropdownRef}>
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm whitespace-nowrap"
                            >
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span className="hidden sm:inline text-gray-700">
                                    {selectedCategory
                                        ? availableCategories.find(c => c.id === selectedCategory)?.name
                                        : 'Kategorie'}
                                </span>
                                {selectedCategory && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCategorySelect(null);
                                        }}
                                        className="hover:bg-gray-300 rounded-full p-0.5 cursor-pointer inline-flex"
                                    >
                                        <X className="w-3 h-3" />
                                    </span>
                                )}
                            </button>

                            {/* Category dropdown */}
                            {showCategoryDropdown && (
                                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-[220px] max-h-[400px] overflow-y-auto z-50">
                                    <div className="px-3 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                        <p className="text-xs font-semibold text-gray-600">Filtrovat podle kategorie</p>
                                    </div>
                                    <button
                                        onClick={() => handleCategorySelect(null)}
                                        className={`w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${!selectedCategory ? 'bg-orange-50' : ''
                                            }`}
                                    >
                                        <span className="text-sm text-gray-700 font-medium">Všechny kategorie</span>
                                        {!selectedCategory && (
                                            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    {availableCategories.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            Žádné kategorie nejsou k dispozici
                                        </div>
                                    ) : (
                                        availableCategories.map(category => (
                                            <button
                                                key={category.id}
                                                onClick={() => handleCategorySelect(category.id)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${selectedCategory === category.id ? 'bg-orange-50' : ''
                                                    }`}
                                            >
                                                <span className="text-sm text-gray-700">{category.name}</span>
                                                {selectedCategory === category.id && (
                                                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tag filter */}
                        <div className="relative flex-shrink-0" ref={tagDropdownRef}>
                            <button
                                onClick={() => setShowTagDropdown(!showTagDropdown)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm whitespace-nowrap"
                            >
                                <TagIcon className="w-4 h-4 text-gray-600" />
                                <span className="hidden sm:inline text-gray-700">Tagy</span>
                                {selectedTags.length > 0 && (
                                    <span className="text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                                        {selectedTags.length}
                                    </span>
                                )}
                            </button>

                            {/* Tag dropdown */}
                            {showTagDropdown && (
                                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-[280px] max-h-[400px] overflow-y-auto z-50">
                                    <div className="px-3 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                        <p className="text-xs font-semibold text-gray-600">Filtrovat podle tagů</p>
                                        {selectedTags.length > 0 && (
                                            <button
                                                onClick={() => setSelectedTags([])}
                                                className="text-xs text-orange-600 hover:text-orange-700 mt-1"
                                            >
                                                Vymazat ({selectedTags.length})
                                            </button>
                                        )}
                                    </div>
                                    {availableTags.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            Žádné tagy nejsou k dispozici
                                        </div>
                                    ) : (
                                        availableTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleTagToggle(tag.id)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${selectedTags.includes(tag.id) ? 'bg-orange-50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedTags.includes(tag.id)
                                                        ? 'bg-orange-500 border-orange-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {selectedTags.includes(tag.id) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{tag.name}</span>
                                                </div>
                                                {tag.recipes_count !== undefined && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                        {tag.recipes_count}
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="flex-shrink-0">
                            {user ? (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        <UserIcon className="w-4 h-4 text-gray-600" />
                                        <span className="hidden md:inline font-semibold text-gray-700 max-w-[100px] truncate">
                                            {user.name}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* User dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-xs text-gray-500">Přihlášen jako</p>
                                                <p className="font-semibold text-gray-700 truncate text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>

                                            <button
                                                onClick={handleEditProfile}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <Settings className="w-4 h-4 text-gray-600" />
                                                <span className="text-gray-700 text-sm">Upravit profil</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    onLogoutClick();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4 text-gray-600" />
                                                <span className="text-gray-700 text-sm">Odhlásit se</span>
                                            </button>

                                            <div className="border-t border-gray-100 mt-1 pt-1">
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                    <span className="text-red-600 text-sm">Smazat účet</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={onLoginClick}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all text-sm whitespace-nowrap"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Přihlásit</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Selected filters row - zobrazí se jen když jsou aktivní filtry */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">Filtry:</span>

                            {/* Selected category */}
                            {selectedCategory && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs">
                                    <span>{availableCategories.find(c => c.id === selectedCategory)?.name}</span>
                                    <button
                                        onClick={() => handleCategorySelect(null)}
                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Selected tags */}
                            {availableTags
                                .filter(tag => selectedTags.includes(tag.id))
                                .map(tag => (
                                    <div
                                        key={tag.id}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs"
                                    >
                                        <span>{tag.name}</span>
                                        <button
                                            onClick={() => handleRemoveTag(tag.id)}
                                            className="hover:bg-orange-200 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                Vymazat vše
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};