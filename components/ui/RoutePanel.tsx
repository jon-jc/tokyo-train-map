"use client";

import { useMapStore } from "@/lib/store";
import { LINE_MAP } from "@/lib/data/lines";
import { STATIONS } from "@/lib/data/stations";
import { OPERATOR_LABELS } from "@/lib/data/types";
import StationInput from "./StationInput";

export default function RoutePanel() {
  const from = useMapStore((s) => s.from);
  const to = useMapStore((s) => s.to);
  const route = useMapStore((s) => s.route);
  const setFrom = useMapStore((s) => s.setFrom);
  const setTo = useMapStore((s) => s.setTo);
  const swapEnds = useMapStore((s) => s.swapEnds);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const focusStation = useMapStore((s) => s.focusStation);

  return (
    <>
      <div className="panel route-box">
        <div className="section-title">Route Planner</div>
        <StationInput
          value={from}
          onSelect={setFrom}
          placeholder="Origin station…"
          icon="▲"
          variant="from"
        />
        <StationInput
          value={to}
          onSelect={setTo}
          placeholder="Destination station…"
          icon="▼"
          variant="to"
        />
        <div className="route-actions">
          <button
            className="icon-btn"
            title="Swap origin and destination"
            onClick={swapEnds}
          >
            ⇅
          </button>
          {(from || to || route) && (
            <button className="btn ghost small" onClick={clearRoute}>
              Clear
            </button>
          )}
          {route && (
            <button
              className="btn small"
              onClick={() => focusStation(route.from)}
            >
              Follow
            </button>
          )}
        </div>
      </div>

      {from && to && !route && (
        <div className="panel route-box">
          <div className="section-title">No Route</div>
          <div className="leg-detail">
            No connection found between these stations.
          </div>
        </div>
      )}

      {route && (
        <div className="panel route-result">
          <div className="route-summary">
            <span>
              <span className="big">{route.totalMinutes}</span>{" "}
              <span className="unit">min</span>
            </span>
            <span className="meta">
              {route.transfers === 0
                ? "direct"
                : `${route.transfers} transfer${route.transfers > 1 ? "s" : ""}`}
              {" · "}
              {STATIONS[route.from].name} → {STATIONS[route.to].name}
            </span>
          </div>

          {route.legs.map((leg, i) => {
            if (leg.kind === "walk") {
              const a = STATIONS[leg.stations[0]];
              const b = STATIONS[leg.stations[leg.stations.length - 1]];
              return (
                <div className="transfer-note" key={`walk-${i}`}>
                  walk {a.name} → {b.name} · {Math.round(leg.minutes)} min
                </div>
              );
            }
            const line = leg.lineId ? LINE_MAP[leg.lineId] : null;
            if (!line) return null;
            const fromSt = STATIONS[leg.stations[0]];
            const toSt = STATIONS[leg.stations[leg.stations.length - 1]];
            const stops = leg.stations.length - 1;
            return (
              <div
                className="leg"
                key={`${line.id}-${i}`}
                style={{ ["--leg-color" as string]: line.color }}
              >
                <div className="leg-line" style={{ color: line.color }}>
                  <span className="badge">{line.shortName}</span>
                  <span>{line.name}</span>
                </div>
                <div className="leg-detail">
                  {OPERATOR_LABELS[line.operator]} · {stops} stop
                  {stops > 1 ? "s" : ""} · {Math.round(leg.minutes)} min
                </div>
                <div className="leg-stations">
                  <b>{fromSt.name}</b>
                  {leg.stations.length > 2 && (
                    <> → {leg.stations
                      .slice(1, -1)
                      .map((id) => STATIONS[id].name)
                      .join(" → ")}</>
                  )}
                  {" → "}
                  <b>{toSt.name}</b>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
