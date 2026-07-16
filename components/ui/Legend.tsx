"use client";

import { useState } from "react";
import { LINES } from "@/lib/data/lines";
import { OPERATOR_LABELS, type Operator } from "@/lib/data/types";
import { useMapStore } from "@/lib/store";

const GROUPS: Operator[] = ["jr", "metro", "toei", "waterfront"];

export default function Legend() {
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
          Network Lines
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
                  <span>{OPERATOR_LABELS[op]}</span>
                  <button onClick={() => setOperatorVisible(op, allHidden)}>
                    {allHidden ? "show all" : "hide all"}
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
                      {line.name}{" "}
                      <span style={{ color: "var(--text-dim)" }}>
                        {line.shortName}
                      </span>
                    </span>
                    <span className="jp">{line.nameJa}</span>
                  </button>
                ))}
              </div>
            );
          })}

          <div className="legend-group" style={{ marginTop: 12 }}>
            <span>Display</span>
          </div>
          <button
            className={`legend-row ${showLabels ? "" : "off"}`}
            onClick={() => setShowLabels(!showLabels)}
          >
            <span className="swatch" style={{ background: "#00f0ff", color: "#00f0ff" }} />
            <span>Station labels</span>
          </button>
          <button
            className={`legend-row ${showBuildings ? "" : "off"}`}
            onClick={() => setShowBuildings(!showBuildings)}
          >
            <span className="swatch" style={{ background: "#33254d", color: "#5b4d8a" }} />
            <span>City blocks</span>
          </button>
        </div>
      )}
    </aside>
  );
}
