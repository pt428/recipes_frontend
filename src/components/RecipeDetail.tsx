import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, ChefHat, Edit, Trash2, Plus, Minus, Check, Globe, Lock, Link2, Copy, X } from 'lucide-react';
import type { RecipeDetailProps, Tag, Recipe } from '../types';
import { recipeApi } from '../api/recipeApi';

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
    recipe: initialRecipe,
    onBack,
    onEdit,
    onDelete,
    currentUser,
    onRecipeUpdate // ✅ PŘIDÁNO
}) => {
    // ✅ OPRAVA: Použijeme lokální state pro recept, aby ho šlo aktualizovat
    const [recipe, setRecipe] = useState<Recipe>(initialRecipe);

    // Debug logging
    console.log('RecipeDetail render - visibility:', recipe.visibility, 'token:', recipe.share_token);

    const isOwner: boolean = currentUser?.id === recipe.user_id;

    const [calculatorMode] = useState<'servings' | 'pieces'>(
        recipe.serving_type || 'servings'
    );

    // ✅ NOVÉ: Synchronizace s prop změnami
    useEffect(() => {
        setRecipe(initialRecipe);
    }, [initialRecipe]);
    const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
    const [currentServings, setCurrentServings] = useState<number>(recipe.servings);
    const [currentPieces, setCurrentPieces] = useState<number>(1);
    const [customInput, setCustomInput] = useState<string>(
        recipe.serving_type === 'pieces' ? '1' : recipe.servings.toString()
    );

    const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
    const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

    // ✅ NOVÉ: Stavy pro sdílení
    const [showShareModal, setShowShareModal] = useState<boolean>(false);
    const [shareUrl, setShareUrl] = useState<string>('');
    const [isEnablingShare, setIsEnablingShare] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    const handleDelete = async () => {
        if (!confirm('Opravdu chcete smazat tento recept? Tato akce je nevratná.')) return;

        try {
            await onDelete(recipe.id);
        } catch (err) {
            console.error('Chyba při mazání receptu:', err);
        }
    };

    const getOriginalLabel = (): string => {
        if (recipe.serving_type === 'pieces') {
            // Skloňování pro "kusy"
            const count = recipe.servings;
            if (count === 1) return 'kus';
            if (count >= 2 && count <= 4) return 'kusy';
            return 'kusů';
        } else {
            // Skloňování pro "porce"
            const count = recipe.servings;
            if (count === 1) return 'porce';
            if (count >= 2 && count <= 4) return 'porce';
            return 'porcí';
        }
    };

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

    const getVisibilityInfo = (): { icon: React.ReactNode; label: string; color: string } => {
        switch (recipe.visibility) {
            case 'public':
                return {
                    icon: <Globe className="w-4 h-4" />,
                    label: 'Veřejný',
                    color: 'bg-green-500/90'
                };
            case 'private':
                return {
                    icon: <Lock className="w-4 h-4" />,
                    label: 'Soukromý',
                    color: 'bg-gray-600/90'
                };
            case 'link':
                return {
                    icon: <Link2 className="w-4 h-4" />,
                    label: 'Sdílený odkaz',
                    color: 'bg-blue-500/90'
                };
            default:
                return {
                    icon: <Globe className="w-4 h-4" />,
                    label: 'Veřejný',
                    color: 'bg-green-500/90'
                };
        }
    };

    // ✅ NOVÉ: Povolení sdíleného odkazu
    const handleEnableShare = async () => {
        setIsEnablingShare(true);
        try {
            const response = await recipeApi.enableShareLink(recipe.id);

            // ✅ OPRAVA: Sestavit URL ve frontendu místo použití z backendu
            const url = `${window.location.origin}/shared/${response.share_token}`;
            setShareUrl(url);
            setShowShareModal(true);

            // ✅ OPRAVA: Aktualizujeme lokální state receptu
            setRecipe(prev => ({
                ...prev,
                visibility: 'link',
                share_token: response.share_token
            }));

            // ✅ NOVÉ: Zavoláme callback pro aktualizaci v HomePage
            if (onRecipeUpdate) {
                await onRecipeUpdate();
            }
        } catch (err) {
            console.error('Chyba při povolení sdílení:', err);
            alert('Nepodařilo se povolit sdílený odkaz.');
        } finally {
            setIsEnablingShare(false);
        }
    };

    // ✅ NOVÉ: Zrušení sdíleného odkazu
    const handleDisableShare = async () => {
        if (!confirm('Opravdu chcete zrušit sdílený odkaz? Odkaz přestane být funkční.')) return;

        try {
            console.log('🔴 Calling disableShareLink API...');
            await recipeApi.disableShareLink(recipe.id);
            console.log('✅ API call successful');

            console.log('🔵 Before update - visibility:', recipe.visibility, 'token:', recipe.share_token);

            // ✅ Aktualizujeme lokální state receptu
            setRecipe(prev => {
                const updated = {
                    ...prev,
                    visibility: 'private' as 'private' | 'public' | 'link',
                    share_token: null
                };
                console.log('🟢 After update - visibility:', updated.visibility, 'token:', updated.share_token);
                return updated;
            });

            setShareUrl('');
            setShowShareModal(false);

            console.log('✅ Share disabled successfully');

            // ✅ NOVÉ: Zavoláme callback pro aktualizaci v HomePage
            if (onRecipeUpdate) {
                await onRecipeUpdate();
            }

        } catch (err) {
            console.error('❌ Chyba při rušení sdílení:', err);
            alert('Nepodařilo se zrušit sdílený odkaz.');
        }
    };

    // ✅ NOVÉ: Zobrazení existujícího odkazu
    const handleShowExistingLink = () => {
        if (recipe.share_token) {
            const url = `${window.location.origin}/api/recipes/by-link/${recipe.share_token}`;
            setShareUrl(url);
            setShowShareModal(true);
        }
    };

    // ✅ NOVÉ: Kopírování odkazu do schránky
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Chyba při kopírování:', err);
            alert('Nepodařilo se zkopírovat odkaz.');
        }
    };

    const increaseCount = (): void => {
        if (calculatorMode === 'servings') {
            const newServings = currentServings + 1;
            setCurrentServings(newServings);
            setServingsMultiplier(newServings / recipe.servings);
            setCustomInput(newServings.toString());
        } else {
            const newPieces = currentPieces + 1;
            setCurrentPieces(newPieces);
            setServingsMultiplier(newPieces);
            setCustomInput(newPieces.toString());
        }
    };

    const decreaseCount = (): void => {
        if (calculatorMode === 'servings') {
            if (currentServings > 1) {
                const newServings = currentServings - 1;
                setCurrentServings(newServings);
                setServingsMultiplier(newServings / recipe.servings);
                setCustomInput(newServings.toString());
            }
        } else {
            if (currentPieces > 1) {
                const newPieces = currentPieces - 1;
                setCurrentPieces(newPieces);
                setServingsMultiplier(newPieces);
                setCustomInput(newPieces.toString());
            }
        }
    };

    const resetCount = (): void => {
        if (calculatorMode === 'servings') {
            setCurrentServings(recipe.servings);
            setServingsMultiplier(1);
            setCustomInput(recipe.servings.toString());
        } else {
            setCurrentPieces(1);
            setServingsMultiplier(1);
            setCustomInput('1');
        }
    };

    const handleCustomInput = (value: string): void => {
        setCustomInput(value);
        const numValue = parseFloat(value);

        if (!isNaN(numValue) && numValue > 0) {
            if (calculatorMode === 'servings') {
                setCurrentServings(numValue);
                setServingsMultiplier(numValue / recipe.servings);
            } else {
                setCurrentPieces(numValue);
                setServingsMultiplier(numValue);
            }
        }
    };

    const calculateAmount = (amount: string | null): string => {
        if (!amount) return '';

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return amount;

        const calculatedAmount = numericAmount * servingsMultiplier;

        return calculatedAmount % 1 === 0
            ? calculatedAmount.toString()
            : calculatedAmount.toFixed(2).replace(/\.?0+$/, '');
    };

    const getCountLabel = (): string => {
        const count = calculatorMode === 'servings' ? currentServings : currentPieces;

        if (calculatorMode === 'servings') {
            return count === 1 ? 'porce' : count < 5 ? 'porce' : 'porcí';
        } else {
            return count === 1 ? 'kus' : count < 5 ? 'kusy' : 'kusů';
        }
    };

    const getCurrentCount = (): number => {
        return calculatorMode === 'servings' ? currentServings : currentPieces;
    };

    const toggleIngredient = (id: number): void => {
        const newChecked = new Set(checkedIngredients);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedIngredients(newChecked);
    };

    const toggleStep = (id: number): void => {
        const newChecked = new Set(checkedSteps);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedSteps(newChecked);
    };

    // ✅ OPRAVA: Vypočítáváme visibilityInfo při každém renderu (nebo když se recipe změní)
    const visibilityInfo = getVisibilityInfo();

    console.log('Current recipe visibility:', recipe.visibility); // Debug

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Zpět na recepty
                        </button>
                    </div>
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

                        <div className="absolute top-6 left-6">
                            <div className={`flex items-center gap-2 px-3 py-1.5 ${visibilityInfo.color} backdrop-blur-sm text-white rounded-full text-sm font-semibold shadow-lg`}>
                                {visibilityInfo.icon}
                                <span>{visibilityInfo.label}</span>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                            <h1 className="text-4xl font-bold text-white mb-3">{recipe.title}</h1>
                            <p className="text-white/90 text-lg mb-3">{recipe.description}</p>

                            {recipe.tags && recipe.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {recipe.tags.map((tag: Tag) => (
                                        <div
                                            key={tag.id}
                                            className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-semibold"
                                        >
                                            {tag.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ✅ UPRAVENO: Tlačítka pro vlastníka */}
                        {isOwner && (
                            <div className="absolute top-6 right-6 flex gap-3">
                                {/* Tlačítko pro sdílení */}
                                {recipe.visibility === 'link' ? (
                                    <button
                                        onClick={handleShowExistingLink}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg hover:bg-blue-600 hover:shadow-xl transform hover:scale-105 transition-all"
                                    >
                                        <Link2 className="w-5 h-5" />
                                        Sdílený odkaz
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnableShare}
                                        disabled={isEnablingShare}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg hover:bg-blue-600 hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Link2 className="w-5 h-5" />
                                        {isEnablingShare ? 'Generuji...' : 'Sdílet'}
                                    </button>
                                )}

                                <button
                                    onClick={() => onEdit(recipe)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl font-semibold shadow-lg hover:bg-white hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                    Upravit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg hover:bg-red-600 hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Smazat
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-orange-500 to-red-500">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <Clock className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{recipeApi.getTotalTime(recipe)} min</div>
                            <div className="text-white/80 text-sm">Čas</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <Users className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{recipe.servings} {getOriginalLabel()}</div>
                            <div className="text-white/80 text-sm">Množství</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <ChefHat className="w-6 h-6 text-white mx-auto mb-2" />
                            <div className="text-white font-semibold">{getDifficultyLabel(recipe.difficulty)}</div>
                            <div className="text-white/80 text-sm">Obtížnost</div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                    Suroviny
                                </h2>

                                <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <button
                                                onClick={decreaseCount}
                                                disabled={getCurrentCount() <= 1}
                                                className="p-2 bg-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <Minus className="w-5 h-5 text-blue-600" />
                                            </button>
                                            <div className="text-center">
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={customInput}
                                                    onChange={(e) => handleCustomInput(e.target.value)}
                                                    className="text-2xl sm:text-3xl font-bold text-blue-600 text-center w-20 sm:w-24 bg-transparent border-b-2 border-blue-300 focus:border-blue-600 focus:outline-none"
                                                />
                                                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                                    {getCountLabel()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={increaseCount}
                                                className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                                            >
                                                <Plus className="w-5 h-5 text-blue-600" />
                                            </button>
                                        </div>
                                        {servingsMultiplier !== 1 && (
                                            <button
                                                onClick={resetCount}
                                                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                                            >
                                                Resetovat
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-orange-50 rounded-2xl p-6">
                                    <ul className="space-y-3">
                                        {recipe.ingredients?.map((ingredient) => (
                                            <li key={ingredient.id} className="flex items-start gap-3 group">
                                                <button
                                                    onClick={() => toggleIngredient(ingredient.id)}
                                                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 mt-0.5 transition-all ${checkedIngredients.has(ingredient.id)
                                                        ? 'bg-orange-500 border-orange-500'
                                                        : 'border-orange-300 hover:border-orange-500'
                                                        }`}
                                                >
                                                    {checkedIngredients.has(ingredient.id) && (
                                                        <Check className="w-5 h-5 text-white" />
                                                    )}
                                                </button>
                                                <span className={`text-gray-700 transition-all ${checkedIngredients.has(ingredient.id) ? 'line-through opacity-50' : ''
                                                    }`}>
                                                    {servingsMultiplier !== 1 && ingredient.amount ? (
                                                        <span className="font-semibold text-blue-600">
                                                            {calculateAmount(ingredient.amount)}
                                                        </span>
                                                    ) : (
                                                        ingredient.amount
                                                    )}{' '}
                                                    {ingredient.unit} {ingredient.name}
                                                    {ingredient.note && ` - ${ingredient.note}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                Postup přípravy
                            </h2>
                            <div className="space-y-4">
                                {recipe.steps?.map((step, index) => (
                                    <div key={step.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all ${checkedSteps.has(step.id) ? 'opacity-50' : ''
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <button
                                                onClick={() => toggleStep(step.id)}
                                                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 transition-all ${checkedSteps.has(step.id)
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {checkedSteps.has(step.id) && (
                                                    <Check className="w-5 h-5 text-white" />
                                                )}
                                            </button>
                                        </div>
                                        <div className={`flex-1 bg-gray-50 rounded-xl p-4 transition-all ${checkedSteps.has(step.id) ? 'opacity-50' : ''
                                            }`}>
                                            <p className={`text-gray-700 ${checkedSteps.has(step.id) ? 'line-through' : ''
                                                }`}>{step.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ NOVÝ: Modal pro sdílený odkaz */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Link2 className="w-6 h-6 text-blue-500" />
                                Sdílený odkaz
                            </h3>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Kdokoliv s tímto odkazem může zobrazit váš recept.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 break-all">
                            <code className="text-sm text-gray-700">{shareUrl}</code>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-600 transition-all"
                            >
                                {copySuccess ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Zkopírováno!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5" />
                                        Kopírovat odkaz
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDisableShare}
                                className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:bg-red-600 transition-all"
                            >
                                Zrušit sdílení
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};