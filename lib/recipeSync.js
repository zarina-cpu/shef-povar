import {
  loadSavedRecipes,
  upsertSavedRecipe,
  writeSavedRecipes,
} from "@/lib/savedRecipes";

export function mergeRecipeLists(local, remote) {
  const map = new Map();

  for (const item of remote) {
    map.set(item.id, item);
  }
  for (const item of local) {
    const existing = map.get(item.id);
    if (!existing || (item.savedAt || 0) >= (existing.savedAt || 0)) {
      map.set(item.id, item);
    }
  }

  return [...map.values()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

async function readApiError(response) {
  try {
    const data = await response.json();
    if (data?.error) {
      return data.error;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchRemoteRecipes() {
  const response = await fetch("/api/recipes", { credentials: "include" });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    const detail = await readApiError(response);
    throw new Error(detail || "Не удалось загрузить рецепты с сервера.");
  }
  const data = await response.json();
  return Array.isArray(data.recipes) ? data.recipes : [];
}

export async function pushRecipeToServer(entry) {
  const response = await fetch("/api/recipes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry }),
  });
  if (response.status === 401) {
    return false;
  }
  if (!response.ok) {
    throw new Error("Не удалось сохранить рецепт в облако.");
  }
  return true;
}

export async function deleteRecipeOnServer(id) {
  const response = await fetch(`/api/recipes?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (response.status === 401) {
    return false;
  }
  if (!response.ok) {
    throw new Error("Не удалось удалить рецепт в облаке.");
  }
  return true;
}

export async function syncRecipesOnLogin() {
  const local = loadSavedRecipes();
  const remote = await fetchRemoteRecipes();
  if (remote === null) {
    return local;
  }

  const merged = mergeRecipeLists(local, remote);
  writeSavedRecipes(merged);

  for (const entry of merged) {
    await pushRecipeToServer(entry);
  }

  return merged;
}

export function saveRecipeLocallyAndMaybeCloud(entry, current, isLoggedIn) {
  const next = upsertSavedRecipe(entry, current);
  writeSavedRecipes(next);
  if (isLoggedIn) {
    pushRecipeToServer(entry).catch(() => {});
  }
  return next;
}
