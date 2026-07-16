"use client";

import { useMapStore } from "./store";
import type { Operator, StationDef, LineDef } from "./data/types";

export type Lang = "en" | "ja";

const dict = {
  en: {
    subtitle: "Rail Network Navigator",
    brandAlt: "東京交通網",
    online: "ONLINE",
    linesLabel: "LINES",
    stationsLabel: "STATIONS",
    viewLevel: "View Level",
    modeAll: "All",
    modeRail: "Rail",
    modeMetro: "Metro",
    locate: "Locate",
    searchPlaceholder: "Search station · 駅名検索…",
    routePlanner: "Route Planner",
    originPh: "Origin station…",
    destPh: "Destination station…",
    clear: "Clear",
    follow: "Follow",
    swapTitle: "Swap origin and destination",
    noRoute: "No Route",
    noRouteMsg: "No connection found between these stations.",
    minUnit: "min",
    direct: "direct",
    walk: "walk",
    setOrigin: "Set Origin",
    setDest: "Set Dest",
    toggleLineTitle: "Toggle line visibility",
    networkLines: "Network Lines",
    hideAll: "hide all",
    showAll: "show all",
    display: "Display",
    stationLabels: "Station labels",
    cityBlocks: "City blocks",
    hintDrag: "DRAG",
    hintOrbit: "ORBIT",
    hintScroll: "SCROLL",
    hintZoom: "ZOOM",
    hintClick: "CLICK",
    hintStation: "STATION",
    jst: "TOKYO JST",
    close: "Close",
  },
  ja: {
    subtitle: "鉄道網ナビゲーター",
    brandAlt: "TOKYO TRANSIT",
    online: "稼働中",
    linesLabel: "路線",
    stationsLabel: "駅",
    viewLevel: "表示レイヤー",
    modeAll: "全線",
    modeRail: "地上",
    modeMetro: "地下",
    locate: "駅検索",
    searchPlaceholder: "駅名を入力…",
    routePlanner: "経路検索",
    originPh: "出発駅…",
    destPh: "到着駅…",
    clear: "クリア",
    follow: "追跡",
    swapTitle: "出発と到着を入れ替え",
    noRoute: "経路なし",
    noRouteMsg: "この駅間の経路が見つかりません。",
    minUnit: "分",
    direct: "直通",
    walk: "徒歩",
    setOrigin: "出発駅に設定",
    setDest: "到着駅に設定",
    toggleLineTitle: "路線の表示切替",
    networkLines: "路線一覧",
    hideAll: "全て隠す",
    showAll: "全て表示",
    display: "表示設定",
    stationLabels: "駅名ラベル",
    cityBlocks: "ビル群",
    hintDrag: "ドラッグ",
    hintOrbit: "回転",
    hintScroll: "スクロール",
    hintZoom: "ズーム",
    hintClick: "クリック",
    hintStation: "駅を選択",
    jst: "東京時間",
    close: "閉じる",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

export function useT() {
  const lang = useMapStore((s) => s.lang);
  const t = (key: TKey): string => dict[lang][key] ?? dict.en[key];
  return { t, lang };
}

export function stationName(st: StationDef, lang: Lang): string {
  return lang === "ja" ? st.nameJa : st.name;
}

export function stationNameAlt(st: StationDef, lang: Lang): string {
  return lang === "ja" ? st.name : st.nameJa;
}

export function lineName(line: LineDef, lang: Lang): string {
  return lang === "ja" ? line.nameJa : line.name;
}

const OPERATORS: Record<Operator, { en: string; ja: string }> = {
  jr: { en: "JR East", ja: "JR東日本" },
  metro: { en: "Tokyo Metro", ja: "東京メトロ" },
  toei: { en: "Toei", ja: "都営地下鉄" },
  waterfront: { en: "Waterfront", ja: "臨海部" },
};

export function operatorLabel(op: Operator, lang: Lang): string {
  return OPERATORS[op][lang];
}

export function fmtTransfers(n: number, lang: Lang): string {
  if (lang === "ja") return `乗換${n}回`;
  return `${n} transfer${n > 1 ? "s" : ""}`;
}

export function fmtStops(n: number, lang: Lang): string {
  if (lang === "ja") return `${n}駅`;
  return `${n} stop${n > 1 ? "s" : ""}`;
}

export function fmtLineCount(n: number, lang: Lang): string {
  if (lang === "ja") return `${n}路線`;
  return `${n} line${n > 1 ? "s" : ""}`;
}
