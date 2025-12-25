//frontend\src\components\Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Search, LogIn, LogOut, User as UserIcon, Settings, Trash2 } from 'lucide-react';
import type { HeaderProps } from '../types';

export const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onLogoutClick, onSearch }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Zavření menu při kliknutí mimo
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleEditProfile = () => {
        setShowUserMenu(false);
        navigate('/profile/edit');
    };

    const handleDeleteAccount = () => {
        setShowUserMenu(false);
        navigate('/profile/delete');
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {/* Logo a název */}
                    <div
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            Recepty.tisoft.cz
                        </h1>
                    </div>

                    {/* User controls */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto relative" ref={menuRef}>
                                {/* User button s dropdown */}
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-1 sm:flex-initial"
                                >
                                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">
                                        {user.name}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown menu */}
                                {showUserMenu && (
                                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-xs text-gray-500">Přihlášen jako</p>
                                            <p className="font-semibold text-gray-700 truncate text-sm">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>

                                        <button
                                            onClick={handleEditProfile}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <Settings className="w-4 h-4 text-gray-600" />
                                            <span className="text-gray-700 text-sm">Upravit profil</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                onLogoutClick();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4 text-gray-600" />
                                            <span className="text-gray-700 text-sm">Odhlásit se</span>
                                        </button>

                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                <span className="text-red-600 text-sm">Smazat účet</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
                            >
                                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                                Přihlásit se
                            </button>
                        )}
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder="Hledat recepty..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors text-sm sm:text-base"
                    />
                </div>
            </div>
        </header>
    );
};