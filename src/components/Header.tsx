import React from 'react';
import { ChefHat, Search, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import type { HeaderProps } from '../types';

export const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onLogoutClick, onSearch }) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {/* Logo a název */}
                    <div className="flex items-center gap-2 sm:gap-3">
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
                            <>
                                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 rounded-xl flex-1 sm:flex-initial">
                                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">
                                        {user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={onLogoutClick}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors text-sm sm:text-base whitespace-nowrap"
                                >
                                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Odhlásit</span>
                                </button>
                            </>
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