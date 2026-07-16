"use client";

import { useMapStore } from "@/lib/store";
import { STATIONS } from "@/lib/data/stations";
import { LINE_MAP } from "@/lib/data/lines";
import { getStationLines } from "@/lib/graph";
import {
  useT,
  stationName,
  stationNameAlt,
  lineName,
  operatorLabel,
  fmtLineCount,
} from "@/lib/i18n";

export default function StationCard() {
  const { t, lang } = useT();
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
        aria-label={t("close")}
        onClick={() => select(null, false)}
      >
        ✕
      </button>
      <div>
        <h2>{stationName(st, lang)}</h2>
        <div className="jp">{stationNameAlt(st, lang)}</div>
      </div>

      <div className="card-actions">
        <button className="btn" onClick={() => setFrom(selected)}>
          {t("setOrigin")}
        </button>
        <button className="btn" onClick={() => setTo(selected)}>
          {t("setDest")}
        </button>
      </div>

      <div className="section-title">{fmtLineCount(lineIds.length, lang)}</div>
      <div className="station-lines">
        {lineIds.map((id) => {
          const line = LINE_MAP[id];
          return (
            <button
              key={id}
              className="station-line-row"
              style={{ opacity: hiddenLines[id] ? 0.4 : 1 }}
              title={t("toggleLineTitle")}
              onClick={() => toggleLine(id)}
            >
              <span
                className="swatch"
                style={{ background: line.color, color: line.color }}
              />
              <span>
                {lineName(line, lang)}{" "}
                <span style={{ color: "var(--text-dim)" }}>
                  ({line.shortName})
                </span>
              </span>
              <span className="op">{operatorLabel(line.operator, lang)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
