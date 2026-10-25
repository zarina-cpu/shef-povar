"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FoodBackground3DCanvas = dynamic(() => import("./FoodBackground3DCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function FoodBackground3D() {
  const [mode, setMode] = useState("off");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMode("off");
      return;
    }
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    setMode(mobile ? "lite" : "full");
  }, []);

  if (mode === "off") {
    return null;
  }

  return (
    <div className="food-bg-3d" aria-hidden="true">
      <FoodBackground3DCanvas lite={mode === "lite"} />
    </div>
  );
}
