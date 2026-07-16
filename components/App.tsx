"use client";

import MapCanvas from "./scene/MapCanvas";
import HUD from "./ui/HUD";
import { useMapStore } from "@/lib/store";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).__mapStore = useMapStore;
}

export default function App() {
  return (
    <>
      <div className="canvas-wrap">
        <MapCanvas />
      </div>
      <div className="vignette-overlay" />
      <div className="scanlines" />
      <HUD />
    </>
  );
}
