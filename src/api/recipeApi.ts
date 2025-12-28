//frontend\src\api\recipeApi.ts
import type { Recipe, User, AuthResponse, LoginCredentials, CreateRecipeData, RegisterData, Tag, Category } from "../types";

// 🔧 Změňte tuto URL na vaši Laravel API URL
const API_BASE_URL = "https://tisoft.cz/recepty/backend/public/api";
const STORAGE_URL = "https://tisoft.cz/recepty/backend/storage/app/public";
// const API_BASE_URL = "http://127.0.0.1:8000/api";
// const STORAGE_URL = "http://127.0.0.1:8000/storage";
// ✅ Vlastní error třída pro validační chyby
class ValidationError extends Error {
  public errors: Record<string, string[]>;
  public status: number;

  constructor(message: string, errors: Record<string, string[]>, status: number) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
    this.status = status;
  }
}

class RecipeApi {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (includeAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // ✅ OPRAVA: Helper pro ošetření síťových chyb (odstraněna rekurze)
  private async safeFetch(url: string, options?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (err) {
      // Síťové chyby (Failed to fetch, Connection refused, atd.)
      if (err instanceof TypeError) {
        throw new Error("Nepodařilo se připojit k serveru. Zkontrolujte, zda běží backend.");
      }
      throw err;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }

      const error = await response.json().catch(() => ({
        message: "Došlo k chybě při komunikaci se serverem",
      }));

      // ✅ NOVÉ: Pokud je to validační chyba (422), vyhoď ValidationError s errors objektem
      if (response.status === 422 && error.errors) {
        throw new ValidationError(error.message, error.errors, response.status);
      }

      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    // ✅ OPRAVA: API vrací { success: true, message: '...', data: [...] }
    // Takže potřebujeme json.data
    if (json.data !== undefined) {
      return json.data as T;
    }

    return json as T;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.safeFetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<void> {
    const response = await this.safeFetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.safeFetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.safeFetch(`${API_BASE_URL}/user`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<User>(response);
  }

  // ✅ NOVÉ: Aktualizace uživatele
  async updateUser(data: { name?: string; email?: string; password?: string; password_confirmation?: string }): Promise<{ message: string; user: User }> {
    const response = await this.safeFetch(`${API_BASE_URL}/user`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; user: User }>(response);
  }

  // ✅ NOVÉ: Smazání uživatele
  async deleteUser(password: string): Promise<{ message: string }> {
    const response = await this.safeFetch(`${API_BASE_URL}/user`, {
      method: "DELETE",
      headers: this.getHeaders(true),
      body: JSON.stringify({ password }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getRecipes(page: number = 1, perPage: number = 12): Promise<{ recipes: Recipe[]; totalPages: number; total: number }> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes?page=${page}&per_page=${perPage}`, {
      headers: this.getHeaders(true),
    });

    const json = await response.json();
    // console.log("API Response (getRecipes):", json); // DEBUG

    // API vrací { success: true, data: { data: [...], current_page, last_page } }
    const paginatorData = json.data;
    // console.log("Paginator data:", paginatorData); // DEBUG

    // Pokud data je pole (starší formát), použijeme ho přímo
    if (Array.isArray(paginatorData)) {
      // console.log("Using array format"); // DEBUG
      return {
        recipes: paginatorData,
        totalPages: 1,
        total: paginatorData.length,
      };
    }

    // Laravel paginator formát: { data: [...], current_page, last_page, total, ... }
    const result = {
      recipes: paginatorData.data || [],
      totalPages: paginatorData.last_page || 1,
      total: paginatorData.total || 0,
    };
    // console.log("Returning:", result); // DEBUG
    return result;
  }

  async updateRecipe(id: number, data: Partial<CreateRecipeData>): Promise<Recipe> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Recipe>(response);
  }

  async createRecipe(data: CreateRecipeData): Promise<Recipe> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Recipe>(response);
  }

  async deleteRecipe(id: number): Promise<void> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }

  async uploadRecipeImage(recipeId: number, file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${recipeId}/image`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return this.handleResponse<{ image_url: string }>(response);
  }

  /**
   * ✅ AKTUALIZOVÁNO: Vyhledávání receptů s podporou tagů a paginace
   */
  /**
   * ✅ AKTUALIZOVÁNO: Vyhledávání receptů s podporou tagů, kategorií a paginace
   */
  async searchRecipes(query: string, tagIds?: number[], categoryId?: number | null, page: number = 1, perPage: number = 12): Promise<{ recipes: Recipe[]; totalPages: number; total: number }> {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.append("q", query);
    }

    if (tagIds && tagIds.length > 0) {
      params.append("tags", tagIds.join(","));
    }

    if (categoryId) {
      params.append("category_id", categoryId.toString());
    }

    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const url = `${API_BASE_URL}/recipes/search${params.toString() ? "?" + params.toString() : ""}`;

    const response = await this.safeFetch(url, {
      headers: this.getHeaders(true),
    });

    const json = await response.json();

    // API vrací { success: true, data: { data: [...], current_page, last_page } }
    const paginatorData = json.data;

    // Pokud data je pole (starší formát), použijeme ho přímo
    if (Array.isArray(paginatorData)) {
      return {
        recipes: paginatorData,
        totalPages: 1,
        total: paginatorData.length,
      };
    }

    // Laravel paginator formát: { data: [...], current_page, last_page, total, ... }
    return {
      recipes: paginatorData.data || [],
      totalPages: paginatorData.last_page || 1,
      total: paginatorData.total || 0,
    };
  }
  async getComments(recipeId: number): Promise<Comment[]> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Comment[]>(response);
  }

  async getRecipe(id: number): Promise<Recipe> {
    const token = localStorage.getItem("token");
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return this.handleResponse<Recipe>(response);
  }

  // Helper methods
  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&h=600&fit=crop";
    }
    return `${STORAGE_URL}/${imagePath}`;
  }

  getTotalTime(recipe: Recipe): number {
    return recipe.prep_time_minutes + recipe.cook_time_minutes;
  }

  async getTags(): Promise<Tag[]> {
    const response = await this.safeFetch(`${API_BASE_URL}/tags`, {
      headers: this.getHeaders(false),
    });

    const json = await response.json();

    // Laravel vrací { data: [...] }
    const tags = json.data || json;

    return Array.isArray(tags) ? tags : [];
  }

  /**
   * Povolí sdílený odkaz pro recept
   */
  async enableShareLink(recipeId: number): Promise<{ share_url: string; share_token: string }> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${recipeId}/share`, {
      method: "POST",
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ share_url: string; share_token: string }>(response);
  }

  /**
   * Zruší sdílený odkaz pro recept
   */
  async disableShareLink(recipeId: number): Promise<void> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/${recipeId}/share`, {
      method: "DELETE",
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }

  /**
   * Načte recept pomocí sdíleného tokenu
   */
  async getRecipeByShareToken(token: string): Promise<Recipe> {
    const response = await this.safeFetch(`${API_BASE_URL}/recipes/by-link/${token}`, {
      headers: this.getHeaders(false), // Veřejný endpoint
    });
    return this.handleResponse<Recipe>(response);
  }

  /**
   * ✅ NOVÉ: Načtení seznamu kategorií
   */
  async getCategories(): Promise<Category[]> {
    const response = await this.safeFetch(`${API_BASE_URL}/categories`, {
      headers: this.getHeaders(false),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error("Nepodařilo se načíst kategorie");
    }
    // Laravel vrací { data: [...] }
    const categories = json.data || json;

    return Array.isArray(categories) ? categories : [];
  }
}

export const recipeApi = new RecipeApi();
export { ValidationError };
