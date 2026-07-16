"use client";

import { useMapStore } from "@/lib/store";
import { LINE_MAP } from "@/lib/data/lines";
import { STATIONS } from "@/lib/data/stations";
import {
  STATION_EXITS,
  getTransferHint,
  getWalkHint,
} from "@/lib/data/exits";
import {
  useT,
  stationName,
  lineName,
  operatorLabel,
  fmtTransfers,
  fmtStops,
} from "@/lib/i18n";
import StationInput from "./StationInput";

export default function RoutePanel() {
  const { t, lang } = useT();
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
        <div className="section-title">{t("routePlanner")}</div>
        <StationInput
          value={from}
          onSelect={setFrom}
          placeholder={t("originPh")}
          icon="▲"
          variant="from"
        />
        <StationInput
          value={to}
          onSelect={setTo}
          placeholder={t("destPh")}
          icon="▼"
          variant="to"
        />
        <div className="route-actions">
          <button className="icon-btn" title={t("swapTitle")} onClick={swapEnds}>
            ⇅
          </button>
          {(from || to || route) && (
            <button className="btn ghost small" onClick={clearRoute}>
              {t("clear")}
            </button>
          )}
          {route && (
            <button
              className="btn small"
              onClick={() => focusStation(route.from)}
            >
              {t("follow")}
            </button>
          )}
        </div>
      </div>

      {from && to && !route && (
        <div className="panel route-box">
          <div className="section-title">{t("noRoute")}</div>
          <div className="leg-detail">{t("noRouteMsg")}</div>
        </div>
      )}

      {route && (
        <div className="panel route-result">
          <div className="route-summary">
            <span>
              <span className="big">{route.totalMinutes}</span>{" "}
              <span className="unit">{t("minUnit")}</span>
            </span>
            <span className="meta">
              {route.transfers === 0
                ? t("direct")
                : fmtTransfers(route.transfers, lang)}
              {" · "}
              {stationName(STATIONS[route.from], lang)} →{" "}
              {stationName(STATIONS[route.to], lang)}
            </span>
          </div>

          {route.legs.map((leg, i) => {
            if (leg.kind === "walk") {
              const a = STATIONS[leg.stations[0]];
              const b = STATIONS[leg.stations[leg.stations.length - 1]];
              const hint = getWalkHint(a.id, b.id, lang);
              return (
                <div key={`walk-${i}`}>
                  <div className="transfer-note">
                    {t("walk")} {stationName(a, lang)} →{" "}
                    {stationName(b, lang)} · {Math.round(leg.minutes)}
                    {t("minUnit")}
                  </div>
                  {hint && <div className="tb-hint walk">{hint}</div>}
                </div>
              );
            }
            const line = leg.lineId ? LINE_MAP[leg.lineId] : null;
            if (!line) return null;

            // Same-station line change: show the optimal exit/passage
            const prev = route.legs[i - 1];
            const transferBlock =
              prev && prev.kind === "ride" && leg.lineId ? (
                <div
                  className="transfer-block"
                  style={{ ["--tb-color" as string]: line.color }}
                >
                  <div className="tb-head">
                    <span className="tb-icon">⇄</span>
                    {t("transferAt")} ·{" "}
                    <b>{stationName(STATIONS[leg.stations[0]], lang)}</b>
                    <span className="tb-time">{t("approxMin")}</span>
                  </div>
                  <div className="tb-hint">
                    {getTransferHint(leg.stations[0], leg.lineId, lang)}
                  </div>
                </div>
              ) : null;
            const fromSt = STATIONS[leg.stations[0]];
            const toSt = STATIONS[leg.stations[leg.stations.length - 1]];
            const stops = leg.stations.length - 1;
            return (
              <div key={`${line.id}-${i}`}>
                {transferBlock}
                <div
                  className="leg"
                  style={{ ["--leg-color" as string]: line.color }}
                >
                <div className="leg-line" style={{ color: line.color }}>
                  <span className="badge">{line.shortName}</span>
                  <span>{lineName(line, lang)}</span>
                </div>
                <div className="leg-detail">
                  {operatorLabel(line.operator, lang)} · {fmtStops(stops, lang)}{" "}
                  · {Math.round(leg.minutes)}
                  {t("minUnit")}
                </div>
                <div className="leg-stations">
                  <b>{stationName(fromSt, lang)}</b>
                  {leg.stations.length > 2 && (
                    <>
                      {" → "}
                      {leg.stations
                        .slice(1, -1)
                        .map((id) => stationName(STATIONS[id], lang))
                        .join(" → ")}
                    </>
                  )}
                  {" → "}
                  <b>{stationName(toSt, lang)}</b>
                </div>
                </div>
              </div>
            );
          })}

          {STATION_EXITS[route.to] && (
            <div className="dest-exits">
              <div className="section-title">
                {t("exitsLabel")} · {stationName(STATIONS[route.to], lang)}
              </div>
              <div className="exit-chips">
                {STATION_EXITS[route.to].map((e) => (
                  <span className="exit-chip" key={e}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
