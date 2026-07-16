import { describe, expect, it } from "vitest";
import { LINES, LINE_MAP, TRANSFERS } from "@/lib/data/lines";
import { STATIONS, STATION_LIST } from "@/lib/data/stations";
import { validateData, getStationLines } from "@/lib/graph";

describe("dataset integrity", () => {
  it("has no validation problems", () => {
    expect(validateData()).toEqual([]);
  });

  it("every line references only existing stations", () => {
    for (const line of LINES) {
      for (const id of line.stations) {
        expect(STATIONS[id], `line ${line.id} references "${id}"`).toBeDefined();
      }
    }
  });

  it("every station is served by at least one line", () => {
    const served = getStationLines();
    for (const st of STATION_LIST) {
      expect(
        served.get(st.id)?.length ?? 0,
        `station ${st.id} is orphaned`,
      ).toBeGreaterThan(0);
    }
  });

  it("station coordinates are within the Tokyo bounding box", () => {
    for (const st of STATION_LIST) {
      expect(st.lat, st.id).toBeGreaterThan(35.5);
      expect(st.lat, st.id).toBeLessThan(35.85);
      expect(st.lng, st.id).toBeGreaterThan(139.5);
      expect(st.lng, st.id).toBeLessThan(139.97);
    }
  });

  it("station ids are unique and kebab-case", () => {
    const ids = STATION_LIST.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("every station has a Japanese name", () => {
    for (const st of STATION_LIST) {
      expect(st.nameJa.length, st.id).toBeGreaterThan(0);
    }
  });

  it("lines have unique ids and valid colors", () => {
    const ids = LINES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const line of LINES) {
      expect(line.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(line.stations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("transfers connect existing, distinct stations", () => {
    for (const t of TRANSFERS) {
      expect(STATIONS[t.a], t.a).toBeDefined();
      expect(STATIONS[t.b], t.b).toBeDefined();
      expect(t.a).not.toBe(t.b);
      expect(t.minutes).toBeGreaterThan(0);
      expect(t.minutes).toBeLessThan(15);
    }
  });

  it("the Yamanote loop has exactly 30 stations", () => {
    expect(LINE_MAP["yamanote"].stations.length).toBe(30);
    expect(LINE_MAP["yamanote"].loop).toBe(true);
  });

  it("every line carries its complete official stop count", () => {
    // Official station counts for each line (within modelled boundaries)
    const expected: Record<string, number> = {
      yamanote: 30,
      "chuo-rapid": 12, // Tokyo–Mitaka segment
      "chuo-sobu": 30, // Mitaka–Nishi-Funabashi segment
      "keihin-tohoku": 22, // Akabane–Kamata segment
      saikyo: 8, // Osaki–Akabane segment
      ginza: 19,
      marunouchi: 25,
      "marunouchi-branch": 4,
      hibiya: 22,
      tozai: 23,
      chiyoda: 20,
      "yurakucho-line": 24,
      hanzomon: 14,
      namboku: 19,
      fukutoshin: 16,
      "asakusa-line": 20,
      "mita-line": 27,
      "shinjuku-line": 21,
      oedo: 28, // loop section
      "oedo-branch": 11, // Hikarigaoka–Tochomae section
      yurikamome: 16,
      rinkai: 8,
    };
    for (const [id, count] of Object.entries(expected)) {
      expect(LINE_MAP[id], id).toBeDefined();
      expect(LINE_MAP[id].stations.length, id).toBe(count);
    }
    // and no line exists that isn't audited above
    for (const line of LINES) {
      expect(expected[line.id], `unaudited line ${line.id}`).toBeDefined();
    }
  });

  it("underground lines are below ground, surface lines above", () => {
    for (const line of LINES) {
      if (line.operator === "metro" || line.id === "oedo") {
        expect(line.elevation, line.id).toBeLessThan(0);
      }
      if (line.id === "yamanote" || line.id === "yurikamome") {
        expect(line.elevation, line.id).toBeGreaterThan(0);
      }
    }
  });
});
