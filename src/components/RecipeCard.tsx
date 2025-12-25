import React from 'react';
import { Clock, Users } from 'lucide-react';
import type { Recipe } from '../types';
import { recipeApi } from '../api/recipeApi';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
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
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-orange-600">
                    {recipe.difficulty}
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {recipe.title}
                </h3>

                <div className="flex items-center justify-between text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{recipeApi.getTotalTime(recipe)} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings} porce</span>
                    </div>
                </div>
            </div>
        </div>
    );
};