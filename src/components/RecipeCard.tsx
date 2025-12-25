//frontend\src\components\RecipeCard.tsx
import React from 'react';
import { Clock, Users, Globe, Lock, Link2 } from 'lucide-react';
import type { Recipe, User } from '../types';
import { recipeApi } from '../api/recipeApi';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
    currentUser?: User | null; // ✅ PŘIDÁNO
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, currentUser }) => {
    const isOwner = currentUser?.id === recipe.user_id;

    // ✅ NOVÉ: Překlad obtížnosti do češtiny
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

    // ✅ NOVÉ: Funkce pro získání info o viditelnosti
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

    // ✅ NOVÉ: Skloňování pro porce/kusy
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

                {/* Badge obtížnosti (vpravo dole) */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-orange-600">
                    {getDifficultyLabel(recipe.difficulty)}
                </div>

                {/* ✅ NOVÝ: Badge viditelnosti (vlevo nahoře) - pouze pro vlastníka */}
                {isOwner && (
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 ${visibilityInfo.color} backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-lg`}>
                        {visibilityInfo.icon}
                        <span>{visibilityInfo.label}</span>
                    </div>
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