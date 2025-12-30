// frontend/src/pages/ProfileDeletePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeApi, ValidationError } from '../api/recipeApi';
import { ArrowLeft, AlertTriangle, Trash2, ChefHat, Eye, EyeOff } from 'lucide-react';
import type { User } from '../types';
import { authStorage } from '../services/auth';

export function ProfileDeletePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const CONFIRM_TEXT = 'SMAZAT';

    // Načti aktuálního uživatele
    useEffect(() => {
        const loadUser = async () => {
            const token = authStorage.getToken();
            if (!token) {
                navigate('/recepty');
                return;
            }

            try {
                const userData = await recipeApi.getCurrentUser();
                setUser(userData);
            } catch (err) {
                console.error('Chyba při načítání uživatele:', err);
                navigate('/recepty');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validace potvrzovacího textu
        if (confirmText !== CONFIRM_TEXT) {
            setErrors({
                confirm: [`Musíte napsat "${CONFIRM_TEXT}" pro potvrzení`]
            });
            return;
        }

        if (!password) {
            setErrors({ password: ['Zadejte heslo pro potvrzení'] });
            return;
        }

        setIsLoading(true);

        try {
            const response = await recipeApi.deleteUser(password);

            // Zobraz úspěšnou zprávu
            alert(response.message);

            // Odhlásit a přesměrovat
            authStorage.removeToken();
            navigate('/recepty');

        } catch (error) {
            if (error instanceof ValidationError) {
                setErrors(error.errors);
            } else if (error instanceof Error) {
                setErrors({ general: [error.message] });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Načítání...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {/* Simple Header */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            Recepty
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/recepty')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zpět na hlavní stránku
                    </button>
                    <h1 className="text-3xl font-bold text-red-600">Smazat účet</h1>
                </div>

                {/* Warning box */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-xl font-bold text-red-800 mb-2">
                                Varování: Tato akce je nevratná!
                            </h2>
                            <p className="text-red-700 mb-4">
                                Smazáním účtu trvale ztratíte:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-red-700">
                                <li>Všechny vaše recepty</li>
                                <li>Všechny vaše komentáře</li>
                                <li>Všechna vaše hodnocení</li>
                                <li>Veškerá data spojená s vaším účtem</li>
                            </ul>
                            <p className="text-red-800 font-semibold mt-4">
                                Tato data nebude možné obnovit!
                            </p>
                        </div>
                    </div>
                </div>

                {/* General error */}
                {errors.general && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
                        {errors.general[0]}
                    </div>
                )}

                {/* Delete form */}
                <form onSubmit={handleDelete} className="bg-white rounded-xl shadow-md p-6 space-y-6" autoComplete="off">
                    <div className="space-y-4">
                        {/* Current user info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Mažete účet:</p>
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>

                        {/* Confirmation text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pro potvrzení napište: <span className="font-bold text-red-600">{CONFIRM_TEXT}</span>
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none transition-colors"
                                placeholder={`Napište ${CONFIRM_TEXT}`}
                                autoComplete="off"
                            />
                            {errors.confirm && (
                                <p className="mt-2 text-sm text-red-600">{errors.confirm[0]}</p>
                            )}
                        </div>

                        {/* Password confirmation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Zadejte své heslo pro potvrzení
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none transition-colors"
                                    placeholder="Vaše heslo"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600">{errors.password[0]}</p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || confirmText !== CONFIRM_TEXT}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-5 h-5" />
                            {isLoading ? 'Mažu účet...' : 'Ano, smazat můj účet'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/recepty')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Zrušit
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 text-center">
                        Pokud si to rozmyslíte, stačí kliknout na "Zrušit"
                    </p>
                </form>
            </div>
        </div>
    );
}