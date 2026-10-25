"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthBar from "@/components/AuthBar";
import DishSuggestions from "@/components/DishSuggestions";
import RecipeCard from "@/components/RecipeCard";
import RecipeForm, { resolveDishTypes, resolveEquipment } from "@/components/RecipeForm";
import SavedRecipes from "@/components/SavedRecipes";
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
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsIntro, setSuggestionsIntro] = useState("");
  const [ideasMode, setIdeasMode] = useState(false);
  const [avoidRecipeTitles, setAvoidRecipeTitles] = useState([]);
  const aiBusyRef = useRef(false);

  async function postJson(url, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let data = {};
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new Error(
            response.status === 504
              ? "Сервер не успел ответить вовремя. Попробуйте ещё раз."
              : "Ошибка сервера. Попробуйте ещё раз."
          );
        }
      }
      if (!response.ok) {
        throw new Error(data.error || "Ошибка сервера.");
      }
      return data;
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error(
          "Долго нет ответа от шефа — слабый интернет или сервер не успел. Попробуйте ещё раз через минуту."
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  const handleAuthChange = useCallback(async (nextUser) => {
    setUser(nextUser);
    if (!nextUser?.id) {
      setSavedRecipes(loadSavedRecipes(null));
      return;
    }

    const userId = nextUser.id;
    try {
      const local = loadSavedRecipes(userId);
      const remote = await fetchRemoteRecipes();
      if (remote === null) {
        setSavedRecipes(local);
        return;
      }
      const merged = mergeRecipeLists(local, remote);
      writeSavedRecipes(merged, userId);
      setSavedRecipes(merged);
      for (const entry of merged) {
        try {
          await pushRecipeToServer(entry);
        } catch {
          /* пропускаем отдельный рецепт */
        }
      }
    } catch {
      setSavedRecipes(loadSavedRecipes(userId));
    }
  }, []);

  useEffect(() => {
    setSavedRecipes(loadSavedRecipes(null));
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

  async function fetchRecipeForIngredients(
    ingredientsText,
    equipment,
    dishTypeLabel,
    avoidTitles = []
  ) {
    const data = await postJson("/api/recipe", {
      ingredients: ingredientsText,
      equipment,
      dishType: dishTypeLabel,
      avoidTitles,
    });
    setRecipe(data.recipe);
    resetRecipeMeta(makeRecipeId());
    setAvoidRecipeTitles(avoidTitles);
    setSuggestions([]);
    setSuggestionsIntro("");
    setIdeasMode(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (aiBusyRef.current || loading) {
      return;
    }
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
    aiBusyRef.current = true;
    setRecipe(null);
    setAvoidRecipeTitles([]);

    if (wantsIdeas) {
      setSuggestions([]);
      setSuggestionsIntro("");
      setIdeasMode(true);

      try {
        const data = await postJson("/api/dish-suggestions", {
          equipment,
          dishType: dishTypeLabel,
        });
        setSuggestionsIntro(data.intro || "");
        setSuggestions(data.dishes || []);
      } catch (err) {
        setError(err.message || "Не получилось подобрать идеи.");
        setIdeasMode(false);
      } finally {
        aiBusyRef.current = false;
        setLoading(false);
      }
      return;
    }

    setIdeasMode(false);
    setSuggestions([]);
    setSuggestionsIntro("");

    try {
      await fetchRecipeForIngredients(trimmed, equipment, dishTypeLabel, []);
    } catch (err) {
      setError(err.message || "Не получилось собрать рецепт.");
    } finally {
      aiBusyRef.current = false;
      setLoading(false);
    }
  }

  function handleCloseRecipe() {
    setRecipe(null);
    setRecipeId("");
    setWant(false);
    setCooked(false);
    setComments("");
    setJustSaved(false);
    setAvoidRecipeTitles([]);
    setError("");
  }

  async function handleAnotherRecipe() {
    if (!recipe || loading || aiBusyRef.current) {
      return;
    }
    const trimmed = ingredients.trim();
    const equipment = resolveEquipment(selected, extraEquipment);
    const dishTypeLabel = resolveDishTypes(dishTypes);
    if (trimmed.length < 3 || !equipment || !dishTypeLabel) {
      return;
    }

    const avoid = [...avoidRecipeTitles, recipe.title].filter(Boolean);
    setError("");
    setLoading(true);
    aiBusyRef.current = true;

    try {
      await fetchRecipeForIngredients(trimmed, equipment, dishTypeLabel, avoid);
    } catch (err) {
      setError(err.message || "Не получилось подобрать другой вариант.");
    } finally {
      aiBusyRef.current = false;
      setLoading(false);
    }
  }

  async function handleCookFromSuggestion(dish) {
    const equipment = resolveEquipment(selected, extraEquipment);
    const dishTypeLabel = resolveDishTypes(dishTypes);
    const list = formatIngredientsList(dish.ingredients);
    setIngredients(list);
    if (loading || aiBusyRef.current) {
      return;
    }
    setError("");
    setLoading(true);
    aiBusyRef.current = true;
    setRecipe(null);
    setAvoidRecipeTitles([]);

    try {
      await fetchRecipeForIngredients(list, equipment, dishTypeLabel, []);
    } catch (err) {
      setError(err.message || "Не получилось собрать рецепт.");
    } finally {
      aiBusyRef.current = false;
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
    writeSavedRecipes(next, user?.id ?? null);
    setJustSaved(true);

    if (user?.id) {
      try {
        await pushRecipeToServer(entry);
      } catch {
        /* локальная копия уже сохранена */
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
    writeSavedRecipes(next, user?.id ?? null);
    if (id === recipeId) {
      setJustSaved(false);
    }
    if (user?.id) {
      try {
        await deleteRecipeOnServer(id);
      } catch {
        /* локально уже удалено */
      }
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="header-actions">
          <AuthBar onAuthChange={handleAuthChange} />
        </div>
        <div className="brand">
          <h1>Шеф из того, что есть дома</h1>
          <p>Создай идеальный ужин из того, что под рукой.</p>
        </div>
      </header>

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
        onAnother={handleAnotherRecipe}
        onClose={handleCloseRecipe}
        loading={loading}
      />

      <SavedRecipes items={savedRecipes} onOpen={openSaved} onRemove={removeSaved} />
    </main>
  );
}
