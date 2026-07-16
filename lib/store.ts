"use client";

import { create } from "zustand";
import { findRoute, type RouteResult } from "./graph";
import { LINES, LINE_MAP } from "./data/lines";
import type { Operator } from "./data/types";
import { stationXZ } from "./geo";

export type ViewMode = "all" | "surface" | "underground";
export type Lang = "en" | "ja";

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem("ntt-lang");
    if (saved === "ja" || saved === "en") return saved;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

/** Is a line part of the currently selected vertical level? */
export function lineInMode(lineId: string, mode: ViewMode): boolean {
  if (mode === "all") return true;
  const elev = LINE_MAP[lineId]?.elevation ?? 0;
  return mode === "surface" ? elev > 0 : elev < 0;
}

export interface FocusRequest {
  target: [number, number, number];
  /** monotonically increasing so repeated focuses on the same target re-trigger */
  key: number;
}

interface MapStore {
  hovered: string | null;
  selected: string | null;
  from: string | null;
  to: string | null;
  route: RouteResult | null;
  hiddenLines: Record<string, boolean>;
  focus: FocusRequest | null;
  showLabels: boolean;
  showBuildings: boolean;
  viewMode: ViewMode;
  lang: Lang;

  setHovered: (id: string | null) => void;
  select: (id: string | null, fly?: boolean) => void;
  focusStation: (id: string) => void;
  setFrom: (id: string | null) => void;
  setTo: (id: string | null) => void;
  swapEnds: () => void;
  plan: () => void;
  clearRoute: () => void;
  toggleLine: (lineId: string) => void;
  setOperatorVisible: (op: Operator, visible: boolean) => void;
  setShowLabels: (v: boolean) => void;
  setShowBuildings: (v: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setLang: (lang: Lang) => void;
}

let focusKey = 0;

const focusOn = (id: string): FocusRequest => {
  const [x, z] = stationXZ(id);
  focusKey += 1;
  return { target: [x, 0, z], key: focusKey };
};

export const useMapStore = create<MapStore>((set, get) => ({
  hovered: null,
  selected: null,
  from: null,
  to: null,
  route: null,
  hiddenLines: {},
  focus: null,
  showLabels: true,
  showBuildings: true,
  viewMode: "all",
  lang: initialLang(),

  setHovered: (id) => {
    if (get().hovered !== id) set({ hovered: id });
  },

  select: (id, fly = true) =>
    set(() => ({
      selected: id,
      ...(id && fly ? { focus: focusOn(id) } : {}),
    })),

  focusStation: (id) => set({ focus: focusOn(id) }),

  setFrom: (id) => {
    set({ from: id });
    const { to } = get();
    if (id && to) get().plan();
    else set({ route: null });
  },

  setTo: (id) => {
    set({ to: id });
    const { from } = get();
    if (from && id) get().plan();
    else set({ route: null });
  },

  swapEnds: () => {
    const { from, to } = get();
    set({ from: to, to: from });
    if (from && to) get().plan();
  },

  plan: () => {
    const { from, to } = get();
    if (!from || !to || from === to) {
      set({ route: null });
      return;
    }
    set({ route: findRoute(from, to) });
  },

  clearRoute: () => set({ route: null, from: null, to: null }),

  toggleLine: (lineId) =>
    set((s) => ({
      hiddenLines: { ...s.hiddenLines, [lineId]: !s.hiddenLines[lineId] },
    })),

  setOperatorVisible: (op, visible) =>
    set((s) => {
      const hiddenLines = { ...s.hiddenLines };
      for (const line of LINES) {
        if (line.operator === op) hiddenLines[line.id] = !visible;
      }
      return { hiddenLines };
    }),

  setShowLabels: (v) => set({ showLabels: v }),
  setShowBuildings: (v) => set({ showBuildings: v }),
  setViewMode: (mode) => set({ viewMode: mode }),

  setLang: (lang) => {
    set({ lang });
    try {
      window.localStorage.setItem("ntt-lang", lang);
    } catch {
      /* storage unavailable */
    }
  },
}));

/** Line ids participating in the current route (for scene dimming). */
export function routeLineIds(route: RouteResult | null): Set<string> {
  const ids = new Set<string>();
  if (!route) return ids;
  for (const leg of route.legs) {
    if (leg.kind === "ride" && leg.lineId) ids.add(leg.lineId);
  }
  return ids;
}
