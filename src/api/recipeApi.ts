import type { Recipe, User, AuthResponse, LoginCredentials, CreateRecipeData  } from "../types";

// 🔧 Změňte tuto URL na vaši Laravel API URL
const API_BASE_URL = "http://127.0.0.1:8000/api";
const STORAGE_URL = "http://127.0.0.1:8000/storage";

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
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
      const error = await response.json().catch(() => ({
        message: "Došlo k chybě při komunikaci se serverem",
      }));
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
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<User>(response);
  }
  async getRecipes(): Promise<Recipe[]> {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      headers: this.getHeaders(true),
    });
    // ✅ handleResponse už vrací přímo pole Recipe[]
    return this.handleResponse<Recipe[]>(response);
  }

  async updateRecipe(id: number, data: Partial<CreateRecipeData>): Promise<Recipe> {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Recipe>(response);
  }
  async createRecipe(data: CreateRecipeData): Promise<Recipe> {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Recipe>(response);
  }

  async deleteRecipe(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(true),
    });
    await this.handleResponse(response);
  }
  async uploadRecipeImage(recipeId: number, file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/image`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return this.handleResponse<{ image_url: string }>(response);
  }
  async searchRecipes(query: string): Promise<Recipe[]> {
    const response = await fetch(`${API_BASE_URL}/recipes/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Recipe[]>(response);
  }

  async getComments(recipeId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Comment[]>(response);
  }

  // Recipe endpoints

  async getRecipe(id: number): Promise<Recipe> {
     const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
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
}

export const recipeApi = new RecipeApi();
