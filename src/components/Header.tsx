import React from 'react';
import { ChefHat, Search, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onLogoutClick, onSearch }) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-2xl shadow-lg">
                            <ChefHat className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            Recepty.tisoft.cz
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                                    <UserIcon className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">{user.name}</span>
                                </div>
                                <button
                                    onClick={onLogoutClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Odhlásit
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                Přihlásit se
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Hledat recepty..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                    />
                </div>
            </div>
        </header>
    );
};