import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import type { CreateRecipeData, IngredientInput, Recipe, RecipeFormProps, StepInput, FormData } from '../types';
import { recipeApi } from '../api/recipeApi';
import { TagInput } from './TagInput';


export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose, onSuccess }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(
        recipe?.image_path ? recipeApi.getImageUrl(recipe.image_path) : null
    );

    const [formData, setFormData] = useState<FormData>({
        title: recipe?.title || '',
        description: recipe?.description || '',
        category_id: recipe?.category_id || undefined,
        difficulty: recipe?.difficulty || 'snadné',
        prep_time_minutes: recipe?.prep_time_minutes || 0,
        cook_time_minutes: recipe?.cook_time_minutes || 0,
        servings: recipe?.servings || 4,
        serving_type: recipe?.serving_type || 'servings',
        visibility: recipe?.visibility || 'public',
        ingredients: recipe?.ingredients?.map((i): IngredientInput => ({
            amount: i.amount || '',
            unit: i.unit || '',
            name: i.name,
            note: i.note || '',
        })) || [{ amount: '', unit: '', name: '', note: '' }],
        steps: recipe?.steps?.map((s): StepInput => ({
            order_index: s.order_index,
            text: s.text,
        })) || [{ order_index: 1, text: '' }],
        tags: recipe?.tags?.map((t): string => t.name) || [],
    });
    const updateServingType = (e: ChangeEvent<HTMLSelectElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            serving_type: e.target.value as 'servings' | 'pieces'
        }));
    };
    // ✅ Přidejte funkci pro změnu tagů
    const updateTags = (tags: string[]): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            tags: tags,
        }));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file: File | undefined = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader: FileReader = new FileReader();
            reader.onloadend = (): void => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (): void => {
        setImageFile(null);
        setImagePreview(null);
    };

    const updateTitle = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            title: e.target.value
        }));
    };

    const updateDescription = (e: ChangeEvent<HTMLTextAreaElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            description: e.target.value
        }));
    };

    const updateDifficulty = (e: ChangeEvent<HTMLSelectElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            difficulty: e.target.value
        }));
    };

    const updateVisibility = (e: ChangeEvent<HTMLSelectElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            visibility: e.target.value as 'public' | 'private' | 'link'
        }));
    };

    const updatePrepTime = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            prep_time_minutes: parseInt(e.target.value) || 0
        }));
    };

    const updateCookTime = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            cook_time_minutes: parseInt(e.target.value) || 0
        }));
    };

    const updateServings = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            servings: parseInt(e.target.value) || 1
        }));
    };

    const addIngredient = (): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            ingredients: [...prev.ingredients, { amount: '', unit: '', name: '', note: '' }],
        }));
    };

    const removeIngredient = (index: number): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            ingredients: prev.ingredients.filter((_: IngredientInput, i: number): boolean => i !== index),
        }));
    };

    const updateIngredient = (index: number, field: keyof IngredientInput, value: string): void => {
        setFormData((prev: FormData): FormData => {
            const newIngredients: IngredientInput[] = [...prev.ingredients];
            newIngredients[index] = { ...newIngredients[index], [field]: value };
            return { ...prev, ingredients: newIngredients };
        });
    };

    const addStep = (): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            steps: [...prev.steps, { order_index: prev.steps.length + 1, text: '' }],
        }));
    };

    const removeStep = (index: number): void => {
        setFormData((prev: FormData): FormData => {
            const newSteps: StepInput[] = prev.steps
                .filter((_: StepInput, i: number): boolean => i !== index)
                .map((step: StepInput, i: number): StepInput => ({ ...step, order_index: i + 1 }));
            return { ...prev, steps: newSteps };
        });
    };

    const updateStep = (index: number, text: string): void => {
        setFormData((prev: FormData): FormData => {
            const newSteps: StepInput[] = [...prev.steps];
            newSteps[index] = { ...newSteps[index], text };
            return { ...prev, steps: newSteps };
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ✅ Převeď FormData na CreateRecipeData (prázdné stringy -> undefined)
            const dataToSend: CreateRecipeData = {
                title: formData.title,
                description: formData.description || undefined,
                category_id: formData.category_id,
                difficulty: formData.difficulty,
                prep_time_minutes: formData.prep_time_minutes,
                cook_time_minutes: formData.cook_time_minutes,
                servings: formData.servings,
                serving_type: formData.serving_type,
                visibility: formData.visibility,
                ingredients: formData.ingredients.map((ing: IngredientInput) => ({
                    amount: ing.amount || undefined,
                    unit: ing.unit || undefined,
                    name: ing.name,
                    note: ing.note || undefined,
                })),
                steps: formData.steps,
                tags: formData.tags.length > 0 ? formData.tags : undefined,
            };

            let savedRecipe: Recipe;

            if (recipe) {
                savedRecipe = await recipeApi.updateRecipe(recipe.id, dataToSend);
            } else {
                savedRecipe = await recipeApi.createRecipe(dataToSend);
            }

            if (imageFile) {
                await recipeApi.uploadRecipeImage(savedRecipe.id, imageFile);
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se uložit recept');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-4xl my-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold">
                            {recipe ? 'Upravit recept' : 'Nový recept'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Obrázek */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Obrázek receptu
                            </label>
                            <div className="flex items-center gap-4">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <label className="cursor-pointer bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Nahrát obrázek
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Základní informace */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Název receptu *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={updateTitle}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                    placeholder="Např. Guláš, Palačinky..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Popis
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={updateDescription}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                    placeholder="Krátký popis receptu..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Obtížnost *
                                </label>
                                <select
                                    required
                                    value={formData.difficulty}
                                    onChange={updateDifficulty}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                >
                                    <option value="easy">Snadné</option>
                                    <option value="medium">Střední</option>
                                    <option value="hard">Náročné</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Viditelnost *
                                </label>
                                <select
                                    required
                                    value={formData.visibility}
                                    onChange={updateVisibility}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                >
                                    <option value="public">Veřejný</option>
                                    <option value="private">Soukromý</option>
                                    <option value="link">Sdílený odkaz</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Čas přípravy (min) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.prep_time_minutes}
                                    onChange={updatePrepTime}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                    placeholder="30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Čas vaření (min) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.cook_time_minutes}
                                    onChange={updateCookTime}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                    placeholder="60"
                                />
                            </div>
                       
                            {/* ✅ NOVÉ: Typ počtu */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Typ množství *
                                </label>
                                <select
                                    required
                                    value={formData.serving_type}
                                    onChange={updateServingType}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                >
                                    <option value="servings">Porce</option>
                                    <option value="pieces">Kusy</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {formData.serving_type === 'servings' ? 'Počet porcí *' : 'Počet kusů *'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.servings}
                                    onChange={updateServings}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                    placeholder={formData.serving_type === 'servings' ? '4' : '1'}
                                />
                            </div>
                        </div>
                            {/* ✅ NOVÉ: Tagy před tlačítky */}
                            <TagInput
                                selectedTags={formData.tags}
                                onChange={updateTags}
                            />

                        {/* Ingredience */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Suroviny *
                                </label>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Přidat
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.ingredients.map((ingredient: IngredientInput, index: number) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            placeholder="Množství"
                                            value={ingredient.amount}
                                            onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'amount', e.target.value)}
                                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Jednotka"
                                            value={ingredient.unit}
                                            onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'unit', e.target.value)}
                                            className="w-24 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Název *"
                                            value={ingredient.name}
                                            onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'name', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Poznámka"
                                            value={ingredient.note}
                                            onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'note', e.target.value)}
                                            className="w-32 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={(): void => removeIngredient(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Postup */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Postup přípravy *
                                </label>
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Přidat krok
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.steps.map((step: StepInput, index: number) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mt-1">
                                            {index + 1}
                                        </div>
                                        <textarea
                                            required
                                            placeholder="Popis kroku *"
                                            value={step.text}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => updateStep(index, e.target.value)}
                                            rows={2}
                                            className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={(): void => removeStep(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-1 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tlačítka */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
                            >
                                {loading ? 'Ukládání...' : recipe ? 'Uložit změny' : 'Vytvořit recept'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Zrušit
                            </button>
                        </div>


                    </form>
                </div>
            </div>
        </div>
    );
};