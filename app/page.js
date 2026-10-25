"use client";

import { useCallback, useEffect, useState } from "react";
import AuthBar from "@/components/AuthBar";
import RecipeCard from "@/components/RecipeCard";
import RecipeForm, { resolveDishType, resolveEquipment } from "@/components/RecipeForm";
import SavedRecipes from "@/components/SavedRecipes";
import ThemeToggle from "@/components/ThemeToggle";
import {
  deleteRecipeOnServer,
  fetchRemoteRecipes,
  mergeRecipeLists,
  pushRecipeToServer,
} from "@/lib/recipeSync";
import {
  loadSavedRecipes,
  makeRecipeId,
  upsertSavedRecipe,
  writeSavedRecipes,
} from "@/lib/savedRecipes";

export default function HomePage() {
  const [ingredients, setIngredients] = useState("");
  const [selected, setSelected] = useState(["stove"]);
  const [extraEquipment, setExtraEquipment] = useState("");
  const [dishType, setDishType] = useState("second");
  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState("");
  const [want, setWant] = useState(false);
  const [cooked, setCooked] = useState(false);
  const [comments, setComments] = useState("");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [syncNote, setSyncNote] = useState("");

  const handleAuthChange = useCallback(async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setSavedRecipes(loadSavedRecipes());
      setSyncNote("");
      return;
    }

    try {
      const local = loadSavedRecipes();
      const remote = await fetchRemoteRecipes();
      if (remote === null) {
        setSavedRecipes(local);
        return;
      }
      const merged = mergeRecipeLists(local, remote);
      writeSavedRecipes(merged);
      setSavedRecipes(merged);
      for (const entry of merged) {
        await pushRecipeToServer(entry);
      }
      setSyncNote("Рецепты синхронизированы с облаком.");
    } catch {
      setSyncNote("Локальные рецепты на месте; облако временно недоступно.");
    }
  }, []);

  useEffect(() => {
    setSavedRecipes(loadSavedRecipes());
  }, []);

  function resetRecipeMeta(nextId) {
    setRecipeId(nextId);
    setWant(false);
    setCooked(false);
    setComments("");
    setJustSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const equipment = resolveEquipment(selected, extraEquipment);
    const dishTypeLabel = resolveDishType(dishType);
    if (!ingredients.trim()) {
      setError("Напишите продукты, которые есть дома.");
      return;
    }
    if (!equipment) {
      setError("Выберите технику или допишите свою.");
      return;
    }
    if (!dishTypeLabel) {
      setError("Выберите тип блюда.");
      return;
    }

    setLoading(true);
    setRecipe(null);

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients.trim(),
          equipment,
          dishType: dishTypeLabel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не получилось собрать рецепт.");
      }
      setRecipe(data.recipe);
      resetRecipeMeta(makeRecipeId());
    } catch (err) {
      setError(err.message || "Не получилось собрать рецепт.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!recipe || !recipeId) {
      return;
    }

    const entry = {
      id: recipeId,
      savedAt: Date.now(),
      recipe,
      ingredients: ingredients.trim(),
      equipment: resolveEquipment(selected, extraEquipment),
      dishType,
      dishTypeLabel: resolveDishType(dishType),
      want,
      cooked,
      comments,
    };
    const next = upsertSavedRecipe(entry, savedRecipes);
    setSavedRecipes(next);
    writeSavedRecipes(next);
    setJustSaved(true);

    if (user) {
      try {
        await pushRecipeToServer(entry);
        setSyncNote("Сохранено на всех ваших устройствах.");
      } catch {
        setSyncNote("Сохранено локально; повторите позже для облака.");
      }
    }
  }

  function openSaved(item) {
    setRecipe(item.recipe);
    setRecipeId(item.id);
    setWant(Boolean(item.want));
    setCooked(Boolean(item.cooked));
    setComments(item.comments || "");
    setIngredients(item.ingredients || ingredients);
    setDishType(item.dishType || "second");
    setJustSaved(true);
    setError("");
  }

  async function removeSaved(id) {
    const next = savedRecipes.filter((item) => item.id !== id);
    setSavedRecipes(next);
    writeSavedRecipes(next);
    if (id === recipeId) {
      setJustSaved(false);
    }
    if (user) {
      try {
        await deleteRecipeOnServer(id);
      } catch {
        setSyncNote("Удалено локально; на сервере может остаться копия.");
      }
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="header-actions">
          <AuthBar onAuthChange={handleAuthChange} />
          <ThemeToggle />
        </div>
        <div className="brand">
          <h1>Шеф из того, что есть дома</h1>
          <p>Список продуктов и техника — на выходе ужин с названием, шагами и калориями.</p>
        </div>
      </header>

      {syncNote ? <p className="status">{syncNote}</p> : null}

      <RecipeForm
        ingredients={ingredients}
        setIngredients={setIngredients}
        selected={selected}
        setSelected={setSelected}
        extraEquipment={extraEquipment}
        setExtraEquipment={setExtraEquipment}
        dishType={dishType}
        setDishType={setDishType}
        loading={loading}
        onSubmit={handleSubmit}
      />

      {error ? <p className="status error">{error}</p> : null}
      {loading ? <p className="status">Составляю блюдо из вашего набора…</p> : null}

      <RecipeCard
        recipe={recipe}
        dishTypeLabel={resolveDishType(dishType)}
        want={want}
        cooked={cooked}
        comments={comments}
        saved={justSaved}
        onWant={() => {
          setWant((value) => !value);
          setJustSaved(false);
        }}
        onCooked={() => {
          setCooked((value) => !value);
          setJustSaved(false);
        }}
        onComments={(value) => {
          setComments(value);
          setJustSaved(false);
        }}
        onSave={handleSave}
      />

      <SavedRecipes items={savedRecipes} onOpen={openSaved} onRemove={removeSaved} />
    </main>
  );
}
