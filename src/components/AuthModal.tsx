import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LoginCredentials, RegisterData } from '../types';
import { recipeApi, ValidationError } from '../api/recipeApi';

interface AuthModalProps {
    onClose: () => void;
    onLogin: (credentials: LoginCredentials) => Promise<void>;
    context?: 'default' | 'create-recipe';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, context = 'default' }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [loginEmail, setLoginEmail] = useState<string>('');
    const [loginPassword, setLoginPassword] = useState<string>('');

    const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState<boolean>(false);

    const [registerData, setRegisterData] = useState<RegisterData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setErrors({});

        try {
            await onLogin({ email: loginEmail, password: loginPassword });
            onClose();
        } catch (err: unknown) {
           

            if (err instanceof ValidationError) {
                
                setErrors(err.errors);
                const firstError = Object.values(err.errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : err.message);
            } else {
                setError(err instanceof Error ? err.message : 'Přihlášení se nezdařilo');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setErrors({});

        if (registerData.password !== registerData.password_confirmation) {
            setError('Hesla se neshodují');
            setErrors({ password_confirmation: ['Hesla se neshodují'] });
            setLoading(false);
            return;
        }

        if (registerData.password.length < 8) {
            setError('Heslo musí mít alespoň 8 znaků');
            setErrors({ password: ['Heslo musí mít alespoň 8 znaků'] });
            setLoading(false);
            return;
        }

        try {
            const data = await recipeApi.register(registerData);
            localStorage.setItem('token', data.token);
            await onLogin({ email: registerData.email, password: registerData.password });
            onClose();
        } catch (err: unknown) {
             

            if (err instanceof ValidationError) {
                 
                setErrors(err.errors);
                const firstError = Object.values(err.errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : err.message);
            } else {
                setError(err instanceof Error ? err.message : 'Registrace se nezdařila');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateRegisterField = (field: keyof RegisterData, value: string): void => {
        setRegisterData((prev: RegisterData): RegisterData => ({
            ...prev,
            [field]: value,
        }));
        // Vyčisti chybu pro dané pole při změně
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const switchMode = (): void => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setErrors({});
        setShowLoginPassword(false);
        setShowRegisterPassword(false);
        setShowRegisterConfirmPassword(false);
    };

    const getTitle = (): string => {
        if (context === 'create-recipe') {
            return mode === 'login' ? 'Přihlaste se' : 'Zaregistrujte se a vytvořte recept';
        }
        return mode === 'login' ? 'Vítejte zpět!' : 'Vytvořit účet';
    };

    const getDescription = (): string => {
        if (context === 'create-recipe') {
            return mode === 'login'
                ? 'Pro vytváření a sdílení receptů je nutné být přihlášený'
                : 'Vytvořte si účet a začněte sdílet své oblíbené recepty';
        }
        return mode === 'login'
            ? 'Přihlaste se ke svým receptům'
            : 'Zaregistrujte se a začněte sdílet recepty';
    };

    console.log('📊 Aktuální errors state:', errors);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg">
                        {context === 'create-recipe' ? (
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {getTitle()}
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    {getDescription()}
                </p>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                        <p className="font-semibold">Chyba</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {mode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="vas@email.cz"
                                value={loginEmail}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                                required
                                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-400' : 'border-gray-200'
                                    } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                            />
                            {errors.email && (
                                <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Heslo
                            </label>
                            <div className="relative">
                                <input
                                    type={showLoginPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                                    required
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 ${errors.password ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showLoginPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transform hover:scale-105 transition-all mt-6"
                        >
                            {loading ? 'Přihlašování...' : 'Přihlásit se'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Přezdívka
                            </label>
                            <input
                                type="text"
                                placeholder="Vaše přezdívka"
                                value={registerData.name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRegisterField('name', e.target.value)}
                                required
                                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.name ? 'border-red-400' : 'border-gray-200'
                                    } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                            />
                            {errors.name && (
                                <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="vas@email.cz"
                                value={registerData.email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRegisterField('email', e.target.value)}
                                required
                                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-400' : 'border-gray-200'
                                    } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                            />
                            {errors.email && (
                                <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Heslo (min. 8 znaků)
                            </label>
                            <div className="relative">
                                <input
                                    type={showRegisterPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={registerData.password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRegisterField('password', e.target.value)}
                                    required
                                    minLength={8}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 ${errors.password ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showRegisterPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Potvrzení hesla
                            </label>
                            <div className="relative">
                                <input
                                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={registerData.password_confirmation}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRegisterField('password_confirmation', e.target.value)}
                                    required
                                    minLength={8}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 ${errors.password_confirmation ? 'border-red-400' : 'border-gray-200'
                                        } focus:border-orange-400 focus:outline-none transition-colors text-gray-800`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showRegisterConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-red-600 text-sm mt-1">{errors.password_confirmation[0]}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transform hover:scale-105 transition-all mt-6"
                        >
                            {loading ? 'Registrace...' : 'Zaregistrovat se'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        {mode === 'login' ? 'Ještě nemáte účet?' : 'Už máte účet?'}
                        {' '}
                        <button
                            type="button"
                            onClick={switchMode}
                            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                        >
                            {mode === 'login' ? 'Zaregistrujte se' : 'Přihlaste se'}
                        </button>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                >
                    Zavřít
                </button>
            </div>
        </div>
    );
};