import { describe, expect, it } from "vitest";
import { CENTER, latLngToXZ, distanceKm, stationXZ } from "@/lib/geo";

describe("geo projection", () => {
  it("maps the projection center to the origin", () => {
    const [x, z] = latLngToXZ(CENTER.lat, CENTER.lng);
    expect(x).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it("maps east to +x and north to -z", () => {
    const [xe] = latLngToXZ(CENTER.lat, CENTER.lng + 0.01);
    expect(xe).toBeGreaterThan(0);
    const [, zn] = latLngToXZ(CENTER.lat + 0.01, CENTER.lng);
    expect(zn).toBeLessThan(0);
  });

  it("computes plausible inter-station distances", () => {
    // Tokyo–Kanda is roughly 1.3 km
    const d = distanceKm("tokyo", "kanda");
    expect(d).toBeGreaterThan(0.7);
    expect(d).toBeLessThan(2);
    // Tokyo–Mitaka is roughly 17-19 km
    const far = distanceKm("tokyo", "mitaka");
    expect(far).toBeGreaterThan(14);
    expect(far).toBeLessThan(22);
  });

  it("is symmetric", () => {
    expect(distanceKm("shibuya", "shinjuku")).toBeCloseTo(
      distanceKm("shinjuku", "shibuya"),
    );
  });

  it("projects stations to a bounded scene", () => {
    const [x, z] = stationXZ("tokyo");
    expect(Math.abs(x)).toBeLessThan(700);
    expect(Math.abs(z)).toBeLessThan(700);
  });
});
