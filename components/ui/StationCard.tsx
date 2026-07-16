"use client";

import { useMapStore } from "@/lib/store";
import { STATIONS } from "@/lib/data/stations";
import { LINE_MAP } from "@/lib/data/lines";
import { OPERATOR_LABELS } from "@/lib/data/types";
import { getStationLines } from "@/lib/graph";

export default function StationCard() {
  const selected = useMapStore((s) => s.selected);
  const select = useMapStore((s) => s.select);
  const setFrom = useMapStore((s) => s.setFrom);
  const setTo = useMapStore((s) => s.setTo);
  const toggleLine = useMapStore((s) => s.toggleLine);
  const hiddenLines = useMapStore((s) => s.hiddenLines);

  if (!selected) return null;
  const st = STATIONS[selected];
  if (!st) return null;
  const lineIds = getStationLines().get(selected) ?? [];

  return (
    <aside className="station-card panel">
      <button
        className="icon-btn close"
        aria-label="Close"
        onClick={() => select(null, false)}
      >
        ✕
      </button>
      <div>
        <h2>{st.name}</h2>
        <div className="jp">{st.nameJa}</div>
      </div>

      <div className="card-actions">
        <button className="btn" onClick={() => setFrom(selected)}>
          Set Origin
        </button>
        <button className="btn" onClick={() => setTo(selected)}>
          Set Dest
        </button>
      </div>

      <div className="section-title">
        {lineIds.length} line{lineIds.length > 1 ? "s" : ""}
      </div>
      <div className="station-lines">
        {lineIds.map((id) => {
          const line = LINE_MAP[id];
          return (
            <button
              key={id}
              className="station-line-row"
              style={{ opacity: hiddenLines[id] ? 0.4 : 1 }}
              title="Toggle line visibility"
              onClick={() => toggleLine(id)}
            >
              <span
                className="swatch"
                style={{ background: line.color, color: line.color }}
              />
              <span>
                {line.name}{" "}
                <span style={{ color: "var(--text-dim)" }}>({line.shortName})</span>
              </span>
              <span className="op">{OPERATOR_LABELS[line.operator]}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
