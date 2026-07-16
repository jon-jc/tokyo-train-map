"use client";

import { useState } from "react";
import { LINES } from "@/lib/data/lines";
import type { Operator } from "@/lib/data/types";
import { useMapStore } from "@/lib/store";
import { useT, lineName, operatorLabel } from "@/lib/i18n";

const GROUPS: Operator[] = ["jr", "metro", "toei", "waterfront"];

export default function Legend() {
  const { t, lang } = useT();
  const [openPanel, setOpenPanel] = useState(true);
  const hiddenLines = useMapStore((s) => s.hiddenLines);
  const toggleLine = useMapStore((s) => s.toggleLine);
  const setOperatorVisible = useMapStore((s) => s.setOperatorVisible);
  const showLabels = useMapStore((s) => s.showLabels);
  const setShowLabels = useMapStore((s) => s.setShowLabels);
  const showBuildings = useMapStore((s) => s.showBuildings);
  const setShowBuildings = useMapStore((s) => s.setShowBuildings);

  return (
    <aside className="legend panel">
      <div
        className="legend-head"
        onClick={() => setOpenPanel((v) => !v)}
        role="button"
        aria-expanded={openPanel}
      >
        <span className="section-title" style={{ pointerEvents: "none" }}>
          {t("networkLines")}
        </span>
        <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
          {openPanel ? "▾" : "▸"}
        </span>
      </div>

      {openPanel && (
        <div className="legend-body">
          {GROUPS.map((op) => {
            const group = LINES.filter((l) => l.operator === op);
            const allHidden = group.every((l) => hiddenLines[l.id]);
            return (
              <div key={op}>
                <div className="legend-group">
                  <span>{operatorLabel(op, lang)}</span>
                  <button onClick={() => setOperatorVisible(op, allHidden)}>
                    {allHidden ? t("showAll") : t("hideAll")}
                  </button>
                </div>
                {group.map((line) => (
                  <button
                    key={line.id}
                    className={`legend-row ${hiddenLines[line.id] ? "off" : ""}`}
                    onClick={() => toggleLine(line.id)}
                  >
                    <span
                      className="swatch"
                      style={{ background: line.color, color: line.color }}
                    />
                    <span>
                      {lineName(line, lang)}{" "}
                      <span style={{ color: "var(--text-dim)" }}>
                        {line.shortName}
                      </span>
                    </span>
                    <span className="jp">
                      {lang === "ja" ? line.name : line.nameJa}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}

          <div className="legend-group" style={{ marginTop: 12 }}>
            <span>{t("display")}</span>
          </div>
          <button
            className={`legend-row ${showLabels ? "" : "off"}`}
            onClick={() => setShowLabels(!showLabels)}
          >
            <span
              className="swatch"
              style={{ background: "#00f0ff", color: "#00f0ff" }}
            />
            <span>{t("stationLabels")}</span>
          </button>
          <button
            className={`legend-row ${showBuildings ? "" : "off"}`}
            onClick={() => setShowBuildings(!showBuildings)}
          >
            <span
              className="swatch"
              style={{ background: "#33254d", color: "#5b4d8a" }}
            />
            <span>{t("cityBlocks")}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
