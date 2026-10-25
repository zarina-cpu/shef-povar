"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FoodBackground3DCanvas = dynamic(() => import("./FoodBackground3DCanvas"), {
  ssr: false,
  loading: () => null,
});

function readDarkTheme() {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.dataset.theme === "dark";
}

export default function FoodBackground3D() {
  const [mode, setMode] = useState("off");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMode("off");
      return;
    }
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    setMode(mobile ? "lite" : "full");
    setDark(readDarkTheme());

    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(readDarkTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (mode === "off") {
    return null;
  }

  return (
    <div className="food-bg-3d" aria-hidden="true">
      <FoodBackground3DCanvas lite={mode === "lite"} dark={dark} />
    </div>
  );
}
