// src/utils/auth.ts (nebo src/services/auth.ts)

const TOKEN_KEY = "recipe_token"; // Změňte pro každou aplikaci: app1_token, app2_token, atd.

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
