//frontend\src\components\TagInput.tsx
import React, { useState, useEffect, useRef, useMemo, type ChangeEvent, type KeyboardEvent } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { recipeApi } from '../api/recipeApi';
import type { Tag } from '../types';

interface TagInputProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ selectedTags, onChange }) => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = useMemo((): Tag[] => {
        // Pokud je input prázdný, zobraz všechny nevybrané tagy
        if (!inputValue.trim()) {
            return availableTags.filter(
                (tag: Tag): boolean => !selectedTags.includes(tag.name)
            );
        }

        // Pokud něco píšeš, filtruj podle inputu
        return availableTags.filter(
            (tag: Tag): boolean =>
                tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedTags.includes(tag.name)
        );
    }, [inputValue, availableTags, selectedTags]);

    const addTag = (tagName: string): void => {
        const trimmedTag = tagName.trim();
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            onChange([...selectedTags, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string): void => {
        onChange(selectedTags.filter((tag: string): boolean => tag !== tagToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    };

    const handleSuggestionClick = (tagName: string): void => {
        addTag(tagName);
        inputRef.current?.focus();
    };

    // ✅ Načtení tagů při mount
    useEffect(() => {
        const loadTags = async (): Promise<void> => {
            try {
                const tags = await recipeApi.getTags();
                setAvailableTags(tags);
            } catch (err) {
                console.error('Chyba při načítání tagů:', err);
            }
        };

        loadTags();
    }, []);

  

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Štítky (tagy)
            </label>

            {/* Vybrané tagy */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag: string, index: number) => (
                    <div
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full text-sm font-semibold shadow-md flex items-center gap-1.5"
                    >
                        <TagIcon className="w-3 h-3" />
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Input s autocomplete */}
            <div className="relative">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Začněte psát nebo vyberte ze seznamu..."
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                    />
                    <button
                        type="button"
                        onClick={() => inputValue.trim() && addTag(inputValue)}
                        disabled={!inputValue.trim()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Přidat
                    </button>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-orange-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((tag: Tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleSuggestionClick(tag.name)}
                                className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2"
                            >
                                <TagIcon className="w-4 h-4 text-orange-500" />
                                <span>{tag.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Nápověda */}
            <p className="text-xs text-gray-500 mt-2">
                Stiskněte Enter nebo klikněte na Přidat pro potvrzení tagu
            </p>

            {/* Populární tagy (pokud žádný není vybraný) */}
            {selectedTags.length === 0 && availableTags.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Populární tagy:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.slice(0, 10).map((tag: Tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => addTag(tag.name)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-orange-100 hover:text-orange-700 transition-colors"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};