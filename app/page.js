"use client";

import { useCallback, useEffect, useState } from "react";
import AuthBar from "@/components/AuthBar";
import DishSuggestions from "@/components/DishSuggestions";
import RecipeCard from "@/components/RecipeCard";
import RecipeForm, { resolveDishTypes, resolveEquipment } from "@/components/RecipeForm";
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
  const [dishTypes, setDishTypes] = useState(["second"]);
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
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsIntro, setSuggestionsIntro] = useState("");
  const [ideasMode, setIdeasMode] = useState(false);

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

  function formatIngredientsList(list) {
    return list.map((item) => `${item.name} — ${item.amount}`).join(", ");
  }

  async function fetchRecipeForIngredients(ingredientsText, equipment, dishTypeLabel) {
    const response = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: ingredientsText,
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
    setSuggestions([]);
    setSuggestionsIntro("");
    setIdeasMode(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const equipment = resolveEquipment(selected, extraEquipment);
    const dishTypeLabel = resolveDishTypes(dishTypes);
    const trimmed = ingredients.trim();
    const hasFullIngredients = trimmed.length >= 3;
    const wantsIdeas = trimmed.length === 0;

    if (!equipment) {
      setError("Выберите технику или допишите свою.");
      return;
    }
    if (!dishTypeLabel) {
      setError("Выберите тип блюда.");
      return;
    }
    if (!wantsIdeas && !hasFullIngredients) {
      setError(
        "Напишите продукты, которые есть дома (хотя бы одно название), или очистите поле — тогда подберём идеи блюд."
      );
      return;
    }

    setLoading(true);
    setRecipe(null);

    if (wantsIdeas) {
      setSuggestions([]);
      setSuggestionsIntro("");
      setIdeasMode(true);

      try {
        const response = await fetch("/api/dish-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipment, dishType: dishTypeLabel }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Не получилось подобрать идеи.");
        }
        setSuggestionsIntro(data.intro || "");
        setSuggestions(data.dishes || []);
      } catch (err) {
        setError(err.message || "Не получилось подобрать идеи.");
        setIdeasMode(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    setIdeasMode(false);
    setSuggestions([]);
    setSuggestionsIntro("");

    try {
      await fetchRecipeForIngredients(trimmed, equipment, dishTypeLabel);
    } catch (err) {
      setError(err.message || "Не получилось собрать рецепт.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCookFromSuggestion(dish) {
    const equipment = resolveEquipment(selected, extraEquipment);
    const dishTypeLabel = resolveDishTypes(dishTypes);
    const list = formatIngredientsList(dish.ingredients);
    setIngredients(list);
    setError("");
    setLoading(true);
    setRecipe(null);

    try {
      await fetchRecipeForIngredients(list, equipment, dishTypeLabel);
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
      dishTypes,
      dishTypeLabel: resolveDishTypes(dishTypes),
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
    if (Array.isArray(item.dishTypes) && item.dishTypes.length) {
      setDishTypes(item.dishTypes);
    } else if (item.dishType) {
      setDishTypes([item.dishType]);
    } else {
      setDishTypes(["second"]);
    }
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
        dishTypes={dishTypes}
        setDishTypes={setDishTypes}
        loading={loading}
        onSubmit={handleSubmit}
      />

      {error ? <p className="status error">{error}</p> : null}
      {loading ? (
        <p className="status">
          {ideasMode ? "Подбираю идеи блюд и списки продуктов…" : "Составляю блюдо из вашего набора…"}
        </p>
      ) : null}

      <DishSuggestions
        intro={suggestionsIntro}
        dishes={suggestions}
        loading={loading}
        onCook={handleCookFromSuggestion}
      />

      <RecipeCard
        recipe={recipe}
        dishTypeLabel={resolveDishTypes(dishTypes)}
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
