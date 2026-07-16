import { describe, expect, it } from "vitest";
import { findRoute } from "@/lib/graph";
import { LINE_MAP } from "@/lib/data/lines";
import { STATIONS } from "@/lib/data/stations";

function expectContiguous(legs: NonNullable<ReturnType<typeof findRoute>>["legs"]) {
  for (let i = 1; i < legs.length; i++) {
    const prevEnd = legs[i - 1].stations[legs[i - 1].stations.length - 1];
    const curStart = legs[i].stations[0];
    expect(curStart).toBe(prevEnd);
  }
}

describe("route finding", () => {
  it("returns null for identical origin and destination", () => {
    expect(findRoute("tokyo", "tokyo")).toBeNull();
  });

  it("returns null for unknown stations", () => {
    expect(findRoute("tokyo", "not-a-station")).toBeNull();
  });

  it("finds a direct Ginza line ride from Shibuya to Asakusa", () => {
    const r = findRoute("shibuya", "asakusa");
    expect(r).not.toBeNull();
    const rides = r!.legs.filter((l) => l.kind === "ride");
    expect(rides).toHaveLength(1);
    expect(rides[0].lineId).toBe("ginza");
    expect(r!.transfers).toBe(0);
    expect(r!.totalMinutes).toBeGreaterThan(20);
    expect(r!.totalMinutes).toBeLessThan(50);
  });

  it("rides the Yamanote loop across the wrap-around edge", () => {
    // Yurakucho and Tokyo are adjacent across the loop closure
    const r = findRoute("yurakucho", "tokyo");
    expect(r).not.toBeNull();
    expect(r!.transfers).toBe(0);
    expect(r!.totalMinutes).toBeLessThanOrEqual(5);
  });

  it("produces contiguous legs from origin to destination", () => {
    const cases: Array<[string, string]> = [
      ["kichijoji", "kita-senju"],
      ["daiba", "ikebukuro"],
      ["naka-meguro", "oshiage"],
      ["kamata", "akabane"],
    ];
    for (const [a, b] of cases) {
      const r = findRoute(a, b);
      expect(r, `${a} -> ${b}`).not.toBeNull();
      expect(r!.legs[0].stations[0]).toBe(a);
      const lastLeg = r!.legs[r!.legs.length - 1];
      expect(lastLeg.stations[lastLeg.stations.length - 1]).toBe(b);
      expectContiguous(r!.legs);
    }
  });

  it("counts transfers as ride legs minus one", () => {
    const r = findRoute("daiba", "ikebukuro");
    expect(r).not.toBeNull();
    const rides = r!.legs.filter((l) => l.kind === "ride");
    expect(r!.transfers).toBe(rides.length - 1);
  });

  it("uses walking transfers where they beat riding around", () => {
    // Hamamatsucho (JR) <-> Daimon (Toei) is a designated 2-minute walk
    const r = findRoute("hamamatsucho", "roppongi");
    expect(r).not.toBeNull();
    // A sane route should be well under 30 minutes
    expect(r!.totalMinutes).toBeLessThan(30);
  });

  it("route times scale with distance", () => {
    const short = findRoute("shibuya", "harajuku")!;
    const long = findRoute("mitaka", "kasai")!;
    expect(short.totalMinutes).toBeLessThan(10);
    expect(long.totalMinutes).toBeGreaterThan(40);
    expect(long.totalMinutes).toBeLessThan(110);
  });

  it("every ride leg follows consecutive stations on its line", () => {
    const r = findRoute("meguro", "kinshicho")!;
    for (const leg of r.legs) {
      if (leg.kind !== "ride" || !leg.lineId) continue;
      const line = LINE_MAP[leg.lineId];
      for (let i = 1; i < leg.stations.length; i++) {
        const ia = line.stations.indexOf(leg.stations[i - 1]);
        const ib = line.stations.indexOf(leg.stations[i]);
        expect(ia, `${leg.stations[i - 1]} on ${line.id}`).toBeGreaterThanOrEqual(0);
        expect(ib, `${leg.stations[i]} on ${line.id}`).toBeGreaterThanOrEqual(0);
        const n = line.stations.length;
        const gap = Math.abs(ia - ib);
        const adjacent = gap === 1 || (line.loop === true && gap === n - 1);
        expect(adjacent, `${leg.stations[i - 1]} -> ${leg.stations[i]}`).toBe(true);
      }
    }
  });

  it("is reachable between every pair of major hubs", () => {
    const majors = Object.values(STATIONS)
      .filter((s) => s.major)
      .map((s) => s.id);
    for (const a of majors) {
      for (const b of majors) {
        if (a === b) continue;
        const r = findRoute(a, b);
        expect(r, `${a} -> ${b}`).not.toBeNull();
        expect(r!.totalMinutes).toBeLessThan(120);
      }
    }
  });
});
