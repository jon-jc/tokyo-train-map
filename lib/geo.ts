import { STATIONS } from "./data/stations";

/** Projection center — roughly the Imperial Palace, between Shinjuku and Tokyo. */
export const CENTER = { lat: 35.685, lng: 139.751 };

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 90430; // at ~35.7°N
/** meters per world unit */
const SCALE = 55;

/** Project WGS84 to scene XZ. +x = east, +z = south (so north points away). */
export function latLngToXZ(lat: number, lng: number): [number, number] {
  const x = ((lng - CENTER.lng) * M_PER_DEG_LNG) / SCALE;
  const z = -((lat - CENTER.lat) * M_PER_DEG_LAT) / SCALE;
  return [x, z];
}

export function stationXZ(id: string): [number, number] {
  const st = STATIONS[id];
  return latLngToXZ(st.lat, st.lng);
}

/** Great-circle-ish distance in km (equirectangular, fine at city scale). */
export function distanceKm(aId: string, bId: string): number {
  const a = STATIONS[aId];
  const b = STATIONS[bId];
  const dx = (a.lng - b.lng) * M_PER_DEG_LNG;
  const dz = (a.lat - b.lat) * M_PER_DEG_LAT;
  return Math.sqrt(dx * dx + dz * dz) / 1000;
}
