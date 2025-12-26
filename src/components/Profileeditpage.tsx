// frontend/src/pages/ProfileEditPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeApi, ValidationError } from '../api/recipeApi';
import { ArrowLeft, Save, ChefHat, Eye, EyeOff } from 'lucide-react';
import type { User } from '../types';

export function ProfileEditPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    // Načti aktuálního uživatele
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const userData = await recipeApi.getCurrentUser();
                setUser(userData);
                setFormData({
                    name: userData.name,
                    email: userData.email,
                    password: '',
                    password_confirmation: '',
                });
            } catch (err) {
                console.error('Chyba při načítání uživatele:', err);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        setErrors({});
        setSuccessMessage('');
        setIsLoading(true);

        try {
            // Připrav data pouze s vyplněnými poli
            const updateData: Record<string, string> = {};

            if (formData.name !== user.name) {
                updateData.name = formData.name;
            }

            if (formData.email !== user.email) {
                updateData.email = formData.email;
            }

            if (formData.password) {
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            if (Object.keys(updateData).length === 0) {
                setSuccessMessage('Nebyly provedeny žádné změny.');
                setIsLoading(false);
                return;
            }

            const response = await recipeApi.updateUser(updateData);

            setSuccessMessage(response.message);
            setUser(response.user);

            // Vyčisti hesla
            setFormData(prev => ({
                ...prev,
                name: response.user.name,
                email: response.user.email,
                password: '',
                password_confirmation: '',
            }));

            // Přesměruj po 2 sekundách
            setTimeout(() => {
                navigate('/');
            }, 2000);

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
                            Recepty.tisoft.cz
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zpět na hlavní stránku
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Upravit profil</h1>
                </div>

                {/* Success message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl">
                        {successMessage}
                    </div>
                )}

                {/* General error */}
                {errors.general && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
                        {errors.general[0]}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Uživatelské jméno
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                            placeholder="Vaše jméno"
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600">{errors.name[0]}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                            placeholder="vas@email.cz"
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-600">{errors.email[0]}</p>
                        )}
                    </div>

                    {/* Password section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Změna hesla
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vyplňte pouze pokud chcete změnit heslo
                        </p>

                        <div className="space-y-4">
                            {/* New password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nové heslo
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        placeholder="Minimálně 8 znaků"
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

                            {/* Confirm password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Potvrzení hesla
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswordConfirmation ? "text" : "password"}
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                                        placeholder="Zadejte heslo znovu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <Save className="w-5 h-5" />
                            {isLoading ? 'Ukládám...' : 'Uložit změny'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Zrušit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}