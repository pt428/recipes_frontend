export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  amount: string | null;
  unit: string | null;
  name: string;
  note: string | null;
}

export interface Step {
  id: number;
  recipe_id: number;
  order_index: number;
  text: string;
}

export interface Tag {
  id: number;
  name: string;
  recipes_count?: number; // Počet receptů s tímto tagem
}

export interface Recipe {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  description: string | null;
  category_id: number | null;
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  serving_type: "servings" | "pieces";
  visibility: "public" | "private" | "link";
  image_path: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  author?: User;
  ingredients?: Ingredient[];
  steps?: Step[];
  tags?: Tag[];
}
export interface ShareLinkResponse {
  data: {
    share_url: string;
    share_token: string;
  };
  message: string;
}
export interface CreateRecipeData {
  title: string;
  description?: string;
  category_id?: number;
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  serving_type: "servings" | "pieces";
  visibility: "public" | "private" | "link";
  ingredients: {
    amount?: string; // ✅ Optional
    unit?: string; // ✅ Optional
    name: string; // ✅ Required
    note?: string; // ✅ Optional
  }[];
  steps: {
    order_index: number;
    text: string;
  }[];
  tags?: string[];
}
 
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
export interface RecipeDetailProps {
  recipe: Recipe;
  currentUser: User | null;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void; // ✅ Potřebujeme toto
  onDelete: (recipeId: number) => void;
  onRecipeUpdate?: () => Promise<void>;
}
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RecipeFormProps {
  recipe?: Recipe;
  onClose: () => void;
  onSuccess: () => void;
}

// ✅ Všechny properties jsou required stringy (pro formulář)
export interface IngredientInput {
  amount: string;
  unit: string;
  name: string;
  note: string;
}

export interface StepInput {
  order_index: number;
  text: string;
}

export  interface FormData {
  title: string;
  description: string;
  category_id?: number;
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  serving_type: "servings" | "pieces";
  visibility: "public" | "private" | "link";
  ingredients: IngredientInput[];
  steps: StepInput[];
  tags: string[];
}
export interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSearch: (query: string, tagIds?: number[], categoryId?: number | null) => void;
  availableTags?: Tag[];
  selectedTagIds?: number[];
  onTagsChange?: (tagIds: number[]) => void;
  onViewChange?: (view: "all" | "my" | "favorites") => void; // ✅ UPRAVENO
  onCreateRecipe?: () => void;
  activeView?: "all" | "my" | "favorites"; // ✅ UPRAVENO
}
 