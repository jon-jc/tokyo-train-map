"use client";

import { useEffect, useState } from "react";
import { STATION_LIST } from "@/lib/data/stations";
import { LINES } from "@/lib/data/lines";
import { useMapStore, type ViewMode } from "@/lib/store";
import { useT } from "@/lib/i18n";
import StationInput from "./StationInput";
import RoutePanel from "./RoutePanel";
import StationCard from "./StationCard";
import Legend from "./Legend";

function TokyoClock() {
  const { t } = useT();
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="clock panel">
      <span className="time">{time}</span>
      <span className="label">{t("jst")}</span>
    </div>
  );
}

function LangToggle() {
  const lang = useMapStore((s) => s.lang);
  const setLang = useMapStore((s) => s.setLang);
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        className={lang === "en" ? "on" : ""}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <button
        className={lang === "ja" ? "on" : ""}
        onClick={() => setLang("ja")}
      >
        日本語
      </button>
    </div>
  );
}

function LevelSwitch() {
  const { t, lang } = useT();
  const viewMode = useMapStore((s) => s.viewMode);
  const setViewMode = useMapStore((s) => s.setViewMode);

  const modes: Array<{ id: ViewMode; en: string; ja: string }> = [
    { id: "all", en: "All", ja: "全線" },
    { id: "surface", en: "Rail", ja: "地上" },
    { id: "underground", en: "Metro", ja: "地下" },
  ];

  return (
    <div className="panel route-box">
      <div className="section-title">{t("viewLevel")}</div>
      <div className="seg" role="tablist" aria-label={t("viewLevel")}>
        {modes.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={viewMode === m.id}
            className={`${viewMode === m.id ? "on" : ""} ${
              m.id === "underground" ? "metro" : ""
            }`}
            onClick={() => setViewMode(m.id)}
          >
            <span>{lang === "ja" ? m.ja : m.en}</span>
            <span className="jp">{lang === "ja" ? m.en : m.ja}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Locate() {
  const { t } = useT();
  const select = useMapStore((s) => s.select);
  const selected = useMapStore((s) => s.selected);
  return (
    <div className="panel route-box">
      <div className="section-title">{t("locate")}</div>
      <StationInput
        value={selected}
        onSelect={(id) => select(id)}
        placeholder={t("searchPlaceholder")}
        icon="⌖"
      />
    </div>
  );
}

export default function HUD() {
  const { t } = useT();
  return (
    <div className="hud">
      <header className="brand panel">
        <LangToggle />
        <h1>
          NEO TOKYO <span className="accent">TRANSIT</span>
        </h1>
        <div className="sub">
          <span>{t("subtitle")}</span>
          <span className="jp">{t("brandAlt")}</span>
        </div>
        <div className="statusline">
          <span className="live">{t("online")}</span>
          <span>
            <b>{LINES.length}</b> {t("linesLabel")}
          </span>
          <span>
            <b>{STATION_LIST.length}</b> {t("stationsLabel")}
          </span>
        </div>
      </header>

      <div className="left-stack">
        <LevelSwitch />
        <Locate />
        <RoutePanel />
      </div>

      <StationCard />
      <Legend />

      <div className="bottom-left">
        <div className="hints panel">
          <span>
            <b>{t("hintDrag")}</b> {t("hintOrbit")}
          </span>
          <span>
            <b>{t("hintScroll")}</b> {t("hintZoom")}
          </span>
          <span>
            <b>{t("hintClick")}</b> {t("hintStation")}
          </span>
        </div>
        <TokyoClock />
      </div>
    </div>
  );
}
