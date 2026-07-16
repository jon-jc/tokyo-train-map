import * as THREE from "three";
import { LINES } from "../data/lines";
import type { LineDef } from "../data/types";
import { STATION_LIST } from "../data/stations";
import { getStationLines } from "../graph";
import { stationXZ } from "../geo";

export interface LineGeometry {
  line: LineDef;
  curve: THREE.CatmullRomCurve3;
  /** station id -> parametric u along the curve (approximate) */
  stationU: Map<string, number>;
  length: number;
}

function buildLineGeometry(line: LineDef): LineGeometry {
  const pts = line.stations.map((id) => {
    const [x, z] = stationXZ(id);
    return new THREE.Vector3(x, line.elevation, z);
  });
  const curve = new THREE.CatmullRomCurve3(
    pts,
    line.loop === true,
    "centripetal",
    0.5,
  );
  const length = curve.getLength();

  // Approximate parametric position of each station along the curve.
  const stationU = new Map<string, number>();
  const divisions = 512;
  const sampled = curve.getSpacedPoints(divisions);
  line.stations.forEach((id, idx) => {
    const p = pts[idx];
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= divisions; i++) {
      const d = sampled[i].distanceToSquared(p);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    // Keep the first occurrence for stations visited twice (loop endpoints)
    if (!stationU.has(id)) stationU.set(id, best / divisions);
  });

  return { line, curve, stationU, length };
}

let cachedLineGeoms: LineGeometry[] | null = null;

export function getLineGeometries(): LineGeometry[] {
  if (!cachedLineGeoms) cachedLineGeoms = LINES.map(buildLineGeometry);
  return cachedLineGeoms;
}

export interface StationNode {
  id: string;
  x: number;
  z: number;
  /** lowest / highest elevation among serving lines */
  minY: number;
  maxY: number;
  lineIds: string[];
  major: boolean;
}

let cachedNodes: StationNode[] | null = null;

export function getStationNodes(): StationNode[] {
  if (cachedNodes) return cachedNodes;
  const linesAt = getStationLines();
  const elevByLine = new Map(LINES.map((l) => [l.id, l.elevation]));
  cachedNodes = STATION_LIST.map((st) => {
    const [x, z] = stationXZ(st.id);
    const lineIds = linesAt.get(st.id) ?? [];
    const elevs = lineIds.map((l) => elevByLine.get(l) ?? 0);
    return {
      id: st.id,
      x,
      z,
      minY: Math.min(0, ...elevs),
      maxY: Math.max(0, ...elevs),
      lineIds,
      major: st.major === true,
    };
  });
  return cachedNodes;
}

let cachedNodeIndex: Map<string, StationNode> | null = null;

export function getStationNode(id: string): StationNode | undefined {
  if (!cachedNodeIndex) {
    cachedNodeIndex = new Map(getStationNodes().map((n) => [n.id, n]));
  }
  return cachedNodeIndex.get(id);
}
