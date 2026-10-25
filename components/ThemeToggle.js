"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "shef-theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = saved === "dark" || saved === "light" ? saved : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle}>
      {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    </button>
  );
}
