"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FoodBackground3DCanvas = dynamic(() => import("./FoodBackground3DCanvas"), {
  ssr: false,
  loading: () => null,
});

function readAccentColor() {
  if (typeof document === "undefined") {
    return "#32b3b3";
  }
  const css = getComputedStyle(document.documentElement).getPropertyValue("--eye-teal").trim();
  return css || "#32b3b3";
}

export default function FoodBackground3D() {
  const [mode, setMode] = useState("off");
  const [accentColor, setAccentColor] = useState("#32b3b3");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMode("off");
      return;
    }
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    setMode(mobile ? "lite" : "full");
    setAccentColor(readAccentColor());

    const root = document.documentElement;
    const observer = new MutationObserver(() => setAccentColor(readAccentColor()));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (mode === "off") {
    return null;
  }

  return (
    <div className="food-bg-3d" aria-hidden="true">
      <FoodBackground3DCanvas lite={mode === "lite"} accentColor={accentColor} />
    </div>
  );
}
