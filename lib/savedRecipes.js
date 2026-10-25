export const SAVED_RECIPES_KEY = "shef-saved-recipes";

export function loadSavedRecipes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_RECIPES_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSavedRecipes(items) {
  window.localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(items));
}

export function upsertSavedRecipe(entry, current) {
  const without = current.filter((item) => item.id !== entry.id);
  return [entry, ...without];
}

export function makeRecipeId() {
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
