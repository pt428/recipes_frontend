//frontend\src\components\RecipeCard.tsx
import React, { useState, useEffect } from 'react';
import { Clock, Users, Globe, Lock, Link2, Heart } from 'lucide-react';
import type { Recipe, User } from '../types';
import { recipeApi } from '../api/recipeApi';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
    currentUser?: User | null;
    isFavorite?: boolean;
    onFavoriteChange?: (recipeId: number, isFavorite: boolean) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
    recipe,
    onClick,
    currentUser,
    isFavorite: initialIsFavorite = false,
    onFavoriteChange
}) => {
    const isOwner = currentUser?.id === recipe.user_id;
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // ✅ NOVÉ: Aktualizuj lokální state když se změní prop
    useEffect(() => {
        
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite, recipe.id]);

    const getDifficultyLabel = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return 'Snadné';
            case 'medium':
                return 'Střední';
            case 'hard':
                return 'Náročné';
            default:
                return difficulty;
        }
    };

    const getVisibilityInfo = () => {
        switch (recipe.visibility) {
            case 'public':
                return {
                    icon: <Globe className="w-3 h-3" />,
                    label: 'Veřejný',
                    color: 'bg-green-500'
                };
            case 'private':
                return {
                    icon: <Lock className="w-3 h-3" />,
                    label: 'Soukromý',
                    color: 'bg-gray-500'
                };
            case 'link':
                return {
                    icon: <Link2 className="w-3 h-3" />,
                    label: 'Sdílený',
                    color: 'bg-blue-500'
                };
            default:
                return {
                    icon: <Globe className="w-3 h-3" />,
                    label: 'Veřejný',
                    color: 'bg-green-500'
                };
        }
    };

    const visibilityInfo = getVisibilityInfo();

    const getServingsLabel = (): string => {
        if (recipe.serving_type === 'pieces') {
            const count = recipe.servings;
            if (count === 1) return 'kus';
            if (count >= 2 && count <= 4) return 'kusy';
            return 'kusů';
        } else {
            const count = recipe.servings;
            if (count === 1) return 'porce';
            if (count >= 2 && count <= 4) return 'porce';
            return 'porcí';
        }
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Zabrání kliknutí na kartu

        if (!currentUser) {
            alert('Pro přidání do oblíbených se musíte přihlásit');
            return;
        }

        if (isTogglingFavorite) return;
 
        setIsTogglingFavorite(true);

        try {
            if (isFavorite) {
               
                await recipeApi.removeFromFavorites(recipe.id);
                setIsFavorite(false);
                onFavoriteChange?.(recipe.id, false);
                
            } else {
               
                await recipeApi.addToFavorites(recipe.id);
                setIsFavorite(true);
                onFavoriteChange?.(recipe.id, true);
                
            }
        } catch (err) {
            console.error('❌ Chyba při změně oblíbených:', err);
            alert(err instanceof Error ? err.message : 'Nepodařilo se změnit oblíbené');
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
        >
            <div className="relative">
                <img
                    src={recipeApi.getImageUrl(recipe.image_path)}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                />

                {/* Badge obtížnosti (vlevo dole) */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-orange-600">
                    {getDifficultyLabel(recipe.difficulty)}
                </div>

                {/* Badge viditelnosti (vpravo nahoře) - pouze pro vlastníka */}
                {isOwner && (
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 ${visibilityInfo.color} backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-lg`}>
                        {visibilityInfo.icon}
                        <span>{visibilityInfo.label}</span>
                    </div>
                )}

                {/* ✅ NOVÉ: Tlačítko oblíbených (vlevo nahoře) */}
                {currentUser && (
                    <button
                        onClick={handleFavoriteClick}
                        disabled={isTogglingFavorite}
                        className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm shadow-lg transition-all transform hover:scale-110 ${isFavorite
                                ? 'bg-red-500 text-white'
                                : 'bg-white/90 text-gray-600 hover:text-red-500'
                            } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                    >
                        <Heart
                            className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
                        />
                    </button>
                )}
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {recipe.title}
                </h3>

                <div className="flex items-center justify-between text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{isOwner ? 'Můj recept' : recipe.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{recipeApi.getTotalTime(recipe)} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings} {getServingsLabel()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};