import React from 'react';
import { ArrowLeft, Clock, Users, ChefHat, Edit, Trash2 } from 'lucide-react';
import type {  RecipeDetailProps } from '../types';
import { recipeApi } from '../api/recipeApi';

// interface RecipeDetailProps {
//     recipe: Recipe;
//     onBack: () => void;
// }

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack, onEdit, onDelete, currentUser }) => {
    const isOwner: boolean = currentUser?.id === recipe.user_id;
    const handleDelete = async () => {
    if (!confirm('Opravdu chcete smazat tento recept? Tato akce je nevratná.')) return;

    try {
        await onDelete(recipe.id);
    } catch (err) {
        console.error('Chyba při mazání receptu:', err);
    }
};
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zpět na recepty
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="relative h-80">
                        <img
                            src={recipeApi.getImageUrl(recipe.image_path)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <h1 className="text-4xl font-bold text-white mb-3">{recipe.title}</h1>
                            <p className="text-white/90 text-lg">{recipe.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-orange-500 to-red-500">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <Clock className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{recipeApi.getTotalTime(recipe)} min</div>
                            <div className="text-white/80 text-sm">Čas</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <Users className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{recipe.servings} porce</div>
                            <div className="text-white/80 text-sm">Porce</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <ChefHat className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{recipe.difficulty}</div>
                            <div className="text-white/80 text-sm">Obtížnost</div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                Suroviny
                            </h2>
                            <div className="bg-orange-50 rounded-2xl p-6">
                                <ul className="space-y-3">
                                    {recipe.ingredients?.map((ingredient) => (
                                        <li key={ingredient.id} className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                            <span className="text-gray-700">
                                                {ingredient.amount} {ingredient.unit} {ingredient.name}
                                                {ingredient.note && ` - ${ingredient.note}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div>
                            {isOwner && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEdit(recipe)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                    >
                                        <Edit className="w-5 h-5" />
                                        Upravit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Smazat
                                    </button>
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                Postup přípravy
                            </h2>
                            <div className="space-y-4">
                                {recipe.steps?.map((step, index) => (
                                    <div key={step.id} className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl p-4">
                                            <p className="text-gray-700">{step.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};