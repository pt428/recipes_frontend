
import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import type { CreateRecipeData, IngredientInput, Recipe, RecipeFormProps, StepInput, FormData } from '../types';
import { recipeApi, ValidationError } from '../api/recipeApi';
import { TagInput } from './TagInput';

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose, onSuccess }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(
        recipe?.image_path ? recipeApi.getImageUrl(recipe.image_path) : null
    );

    const [formData, setFormData] = useState<FormData>({
        title: recipe?.title || '',
        description: recipe?.description || '',
        category_id: recipe?.category_id || undefined,
        difficulty: recipe?.difficulty || 'easy',
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
        // Vyčisti chybu při změně
        if (errors.serving_type) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.serving_type;
                return newErrors;
            });
        }
    };

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
            // Vyčisti chybu obrázku
            if (errors.image) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.image;
                    return newErrors;
                });
            }
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
        // Vyčisti chybu při změně
        if (errors.title) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.title;
                return newErrors;
            });
        }
    };

    const updateDescription = (e: ChangeEvent<HTMLTextAreaElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            description: e.target.value
        }));
        // Vyčisti chybu při změně
        if (errors.description) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.description;
                return newErrors;
            });
        }
    };

    const updateDifficulty = (e: ChangeEvent<HTMLSelectElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            difficulty: e.target.value
        }));
        // Vyčisti chybu při změně
        if (errors.difficulty) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.difficulty;
                return newErrors;
            });
        }
    };

    const updateVisibility = (e: ChangeEvent<HTMLSelectElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            visibility: e.target.value as 'public' | 'private' | 'link'
        }));
        // Vyčisti chybu při změně
        if (errors.visibility) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.visibility;
                return newErrors;
            });
        }
    };

    const updatePrepTime = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            prep_time_minutes: parseInt(e.target.value) || 0
        }));
        // Vyčisti chybu při změně
        if (errors.prep_time_minutes) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.prep_time_minutes;
                return newErrors;
            });
        }
    };

    const updateCookTime = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            cook_time_minutes: parseInt(e.target.value) || 0
        }));
        // Vyčisti chybu při změně
        if (errors.cook_time_minutes) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.cook_time_minutes;
                return newErrors;
            });
        }
    };

    const updateServings = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            servings: parseInt(e.target.value) || 1
        }));
        // Vyčisti chybu při změně
        if (errors.servings) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.servings;
                return newErrors;
            });
        }
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
        // Vyčisti chybu ingredience při změně
        const errorKey = `ingredients.${index}.${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
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
        // Vyčisti chybu kroku při změně
        const errorKey = `steps.${index}.text`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
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
            if (err instanceof ValidationError) {
                setErrors(err.errors);
            } else {
                setErrors({ general: [err instanceof Error ? err.message : 'Nepodařilo se uložit recept'] });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
                {/* Modal Container - Responsive */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-4xl my-4 sm:my-8">
                    {/* Header - Responsive */}
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                            {recipe ? 'Upravit recept' : 'Nový recept'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    {/* General Error Message - Responsive */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm sm:text-base">
                            {errors.general[0]}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Image Upload - Responsive */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Obrázek receptu
                            </label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                                    </div>
                                )}
                                <label className="cursor-pointer bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm sm:text-base">
                                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Nahrát obrázek
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {errors.image && (
                                <p className="mt-2 text-sm text-red-600">{errors.image[0]}</p>
                            )}
                        </div>

                        {/* Basic Info - Responsive Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Název receptu *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={updateTitle}
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.title ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                    placeholder="Např. Guláš, Palačinky..."
                                />
                                {errors.title && (
                                    <p className="mt-2 text-sm text-red-600">{errors.title[0]}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Popis
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={updateDescription}
                                    rows={3}
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.description ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                    placeholder="Krátký popis receptu..."
                                />
                                {errors.description && (
                                    <p className="mt-2 text-sm text-red-600">{errors.description[0]}</p>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Obtížnost *
                                </label>
                                <select
                                    required
                                    value={formData.difficulty}
                                    onChange={updateDifficulty}
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.difficulty ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                >
                                    <option value="easy">Snadné</option>
                                    <option value="medium">Střední</option>
                                    <option value="hard">Náročné</option>
                                </select>
                                {errors.difficulty && (
                                    <p className="mt-2 text-sm text-red-600">{errors.difficulty[0]}</p>
                                )}
                            </div>

                            {/* Visibility */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Viditelnost *
                                </label>
                                <select
                                    required
                                    value={formData.visibility}
                                    onChange={updateVisibility}
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.visibility ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                >
                                    <option value="public">Veřejný</option>
                                    <option value="private">Soukromý</option>
                                    <option value="link">Sdílený odkaz</option>
                                </select>
                                {errors.visibility && (
                                    <p className="mt-2 text-sm text-red-600">{errors.visibility[0]}</p>
                                )}
                            </div>

                            {/* Prep Time */}
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
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.prep_time_minutes ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                    placeholder="30"
                                />
                                {errors.prep_time_minutes && (
                                    <p className="mt-2 text-sm text-red-600">{errors.prep_time_minutes[0]}</p>
                                )}
                            </div>

                            {/* Cook Time */}
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
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.cook_time_minutes ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                    placeholder="60"
                                />
                                {errors.cook_time_minutes && (
                                    <p className="mt-2 text-sm text-red-600">{errors.cook_time_minutes[0]}</p>
                                )}
                            </div>

                            {/* Serving Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Typ množství *
                                </label>
                                <select
                                    required
                                    value={formData.serving_type}
                                    onChange={updateServingType}
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.serving_type ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                >
                                    <option value="servings">Porce</option>
                                    <option value="pieces">Kusy</option>
                                </select>
                                {errors.serving_type && (
                                    <p className="mt-2 text-sm text-red-600">{errors.serving_type[0]}</p>
                                )}
                            </div>

                            {/* Servings */}
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
                                    className={`w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 ${errors.servings ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                    placeholder={formData.serving_type === 'servings' ? '4' : '1'}
                                />
                                {errors.servings && (
                                    <p className="mt-2 text-sm text-red-600">{errors.servings[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <TagInput
                            selectedTags={formData.tags}
                            onChange={updateTags}
                        />

                        {/* Ingredients - Responsive */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Suroviny *
                                </label>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                                >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Přidat</span>
                                </button>
                            </div>
                            {errors.ingredients && (
                                <p className="mb-2 text-sm text-red-600">{errors.ingredients[0]}</p>
                            )}
                            <div className="space-y-2 sm:space-y-3">
                                {formData.ingredients.map((ingredient: IngredientInput, index: number) => (
                                    <div key={index} className="space-y-2">
                                        {/* Mobile: Stack vertically */}
                                        <div className="flex sm:hidden flex-col gap-2">
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="Množ."
                                                    value={ingredient.amount}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'amount', e.target.value)}
                                                    className={`w-14 px-1.5 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.amount`] ? 'border-red-400' : 'border-gray-200'
                                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm`}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Jedn."
                                                    value={ingredient.unit}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'unit', e.target.value)}
                                                    className={`w-14 px-1.5 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.unit`] ? 'border-red-400' : 'border-gray-200'
                                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm`}
                                                />
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Název *"
                                                    value={ingredient.name}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'name', e.target.value)}
                                                    className={`flex-1 min-w-0 px-2 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.name`] ? 'border-red-400' : 'border-gray-200'
                                                        } focus:border-orange-400 focus:outline-none transition-colors text-sm`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(): void => removeIngredient(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Poznámka (volitelné)"
                                                value={ingredient.note}
                                                onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'note', e.target.value)}
                                                className={`w-full px-2 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.note`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors text-sm`}
                                            />
                                        </div>

                                        {/* Desktop: Horizontal */}
                                        <div className="hidden sm:flex gap-2 items-start">
                                            <input
                                                type="text"
                                                placeholder="Množství"
                                                value={ingredient.amount}
                                                onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'amount', e.target.value)}
                                                className={`w-20 px-3 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.amount`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors`}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Jednotka"
                                                value={ingredient.unit}
                                                onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'unit', e.target.value)}
                                                className={`w-24 px-3 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.unit`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors`}
                                            />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Název *"
                                                value={ingredient.name}
                                                onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'name', e.target.value)}
                                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.name`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors`}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Poznámka"
                                                value={ingredient.note}
                                                onChange={(e: ChangeEvent<HTMLInputElement>): void => updateIngredient(index, 'note', e.target.value)}
                                                className={`w-32 px-3 py-2 rounded-lg border-2 ${errors[`ingredients.${index}.note`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors`}
                                            />
                                            <button
                                                type="button"
                                                onClick={(): void => removeIngredient(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Chyby pro ingredienci */}
                                        {(errors[`ingredients.${index}.name`] || errors[`ingredients.${index}.amount`] ||
                                            errors[`ingredients.${index}.unit`] || errors[`ingredients.${index}.note`]) && (
                                                <div className="text-sm text-red-600 ml-2">
                                                    {errors[`ingredients.${index}.name`] && <p>{errors[`ingredients.${index}.name`][0]}</p>}
                                                    {errors[`ingredients.${index}.amount`] && <p>{errors[`ingredients.${index}.amount`][0]}</p>}
                                                    {errors[`ingredients.${index}.unit`] && <p>{errors[`ingredients.${index}.unit`][0]}</p>}
                                                    {errors[`ingredients.${index}.note`] && <p>{errors[`ingredients.${index}.note`][0]}</p>}
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Steps - Responsive */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Postup přípravy *
                                </label>
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                                >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Přidat krok</span>
                                </button>
                            </div>
                            {errors.steps && (
                                <p className="mb-2 text-sm text-red-600">{errors.steps[0]}</p>
                            )}
                            <div className="space-y-2 sm:space-y-3">
                                {formData.steps.map((step: StepInput, index: number) => (
                                    <div key={index}>
                                        <div className="flex gap-2 items-start">
                                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mt-1 text-sm sm:text-base">
                                                {index + 1}
                                            </div>
                                            <textarea
                                                required
                                                placeholder="Popis kroku *"
                                                value={step.text}
                                                onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => updateStep(index, e.target.value)}
                                                rows={2}
                                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${errors[`steps.${index}.text`] ? 'border-red-400' : 'border-gray-200'
                                                    } focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base`}
                                            />
                                            <button
                                                type="button"
                                                onClick={(): void => removeStep(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-1 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                        {errors[`steps.${index}.text`] && (
                                            <p className="mt-2 ml-10 text-sm text-red-600">{errors[`steps.${index}.text`][0]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons - Responsive */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all text-sm sm:text-base"
                            >
                                {loading ? 'Ukládání...' : recipe ? 'Uložit změny' : 'Vytvořit recept'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
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