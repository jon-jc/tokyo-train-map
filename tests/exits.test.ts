import { describe, expect, it } from "vitest";
import {
  STATION_EXITS,
  TRANSFER_HINTS,
  WALK_HINTS,
  getTransferHint,
  getWalkHint,
} from "@/lib/data/exits";
import { STATIONS } from "@/lib/data/stations";
import { LINE_MAP, TRANSFERS } from "@/lib/data/lines";
import { getStationLines } from "@/lib/graph";

describe("wayfinding data", () => {
  it("station exits reference existing stations", () => {
    for (const id of Object.keys(STATION_EXITS)) {
      expect(STATIONS[id], id).toBeDefined();
      expect(STATION_EXITS[id].length).toBeGreaterThan(0);
    }
  });

  it("transfer hints reference existing stations and lines that serve them", () => {
    const serving = getStationLines();
    for (const key of Object.keys(TRANSFER_HINTS)) {
      const [stationId, lineId] = key.split("|");
      expect(STATIONS[stationId], key).toBeDefined();
      expect(LINE_MAP[lineId], key).toBeDefined();
      expect(serving.get(stationId), key).toContain(lineId);
      expect(TRANSFER_HINTS[key].en.length).toBeGreaterThan(0);
      expect(TRANSFER_HINTS[key].ja.length).toBeGreaterThan(0);
    }
  });

  it("walk hints reference existing station pairs", () => {
    for (const key of Object.keys(WALK_HINTS)) {
      const [a, b] = key.split("+");
      expect(STATIONS[a], key).toBeDefined();
      expect(STATIONS[b], key).toBeDefined();
    }
  });

  it("every designated walking transfer has curated guidance", () => {
    for (const tr of TRANSFERS) {
      expect(
        getWalkHint(tr.a, tr.b, "en"),
        `missing walk hint for ${tr.a} <-> ${tr.b}`,
      ).toBeTruthy();
      expect(getWalkHint(tr.a, tr.b, "ja")).toBeTruthy();
    }
  });

  it("falls back to signage guidance for uncurated transfers", () => {
    const en = getTransferHint("kayabacho", "tozai", "en");
    expect(en).toContain("Tozai");
    const ja = getTransferHint("kayabacho", "tozai", "ja");
    expect(ja).toContain("東西線");
  });

  it("walk hint is symmetric", () => {
    expect(getWalkHint("hamamatsucho", "daimon", "en")).toBe(
      getWalkHint("daimon", "hamamatsucho", "en"),
    );
  });
});
