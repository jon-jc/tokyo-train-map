import { LINES, LINE_MAP, TRANSFERS } from "./data/lines";
import { STATIONS } from "./data/stations";
import { distanceKm } from "./geo";

/**
 * Routing graph over (station, line) pairs so that transfers —
 * including same-station line changes — carry a realistic penalty.
 */

export interface RouteLeg {
  kind: "ride" | "walk";
  lineId?: string;
  /** Station ids in travel order, inclusive of both ends */
  stations: string[];
  minutes: number;
}

export interface RouteResult {
  from: string;
  to: string;
  legs: RouteLeg[];
  totalMinutes: number;
  transfers: number;
}

interface Edge {
  to: string; // node key
  minutes: number;
  kind: "ride" | "transfer" | "walk";
}

/** Average metro speed incl. dwell — used to estimate hop times. */
const AVG_SPEED_KMH = 34;
const DWELL_MIN = 0.6;
/** Cost of changing lines within one station (walk + expected wait). */
const SAME_STATION_TRANSFER_MIN = 6;
/** Extra expected wait added on top of walking time for OOS transfers. */
const WALK_TRANSFER_WAIT_MIN = 3;

const nodeKey = (stationId: string, lineId: string) => `${stationId}@${lineId}`;

function hopMinutes(a: string, b: string): number {
  const d = distanceKm(a, b);
  return Math.max(1.2, (d / AVG_SPEED_KMH) * 60 + DWELL_MIN);
}

function buildGraph(): Map<string, Edge[]> {
  const graph = new Map<string, Edge[]>();
  const addEdge = (from: string, to: string, minutes: number, kind: Edge["kind"]) => {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({ to, minutes, kind });
  };

  // Ride edges along each line
  for (const line of LINES) {
    const st = line.stations;
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < st.length - 1; i++) pairs.push([st[i], st[i + 1]]);
    if (line.loop) pairs.push([st[st.length - 1], st[0]]);
    for (const [a, b] of pairs) {
      const t = hopMinutes(a, b);
      addEdge(nodeKey(a, line.id), nodeKey(b, line.id), t, "ride");
      addEdge(nodeKey(b, line.id), nodeKey(a, line.id), t, "ride");
    }
  }

  // Same-station transfers between lines
  const linesAt = stationLines();
  for (const [stationId, lineIds] of linesAt) {
    for (const a of lineIds) {
      for (const b of lineIds) {
        if (a === b) continue;
        addEdge(
          nodeKey(stationId, a),
          nodeKey(stationId, b),
          SAME_STATION_TRANSFER_MIN,
          "transfer",
        );
      }
    }
  }

  // Out-of-station walking transfers
  for (const tr of TRANSFERS) {
    const aLines = linesAt.get(tr.a) ?? [];
    const bLines = linesAt.get(tr.b) ?? [];
    const cost = tr.minutes + WALK_TRANSFER_WAIT_MIN;
    for (const la of aLines) {
      for (const lb of bLines) {
        addEdge(nodeKey(tr.a, la), nodeKey(tr.b, lb), cost, "walk");
        addEdge(nodeKey(tr.b, lb), nodeKey(tr.a, la), cost, "walk");
      }
    }
  }

  return graph;
}

/** Map of stationId -> line ids serving it */
export function stationLines(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const line of LINES) {
    for (const st of line.stations) {
      if (!map.has(st)) map.set(st, []);
      const arr = map.get(st)!;
      if (!arr.includes(line.id)) arr.push(line.id);
    }
  }
  return map;
}

let cachedGraph: Map<string, Edge[]> | null = null;
let cachedStationLines: Map<string, string[]> | null = null;

function getGraph() {
  if (!cachedGraph) cachedGraph = buildGraph();
  return cachedGraph;
}

export function getStationLines() {
  if (!cachedStationLines) cachedStationLines = stationLines();
  return cachedStationLines;
}

interface PrevEntry {
  node: string;
  kind: Edge["kind"];
  minutes: number;
}

/** Dijkstra over the (station, line) graph. */
export function findRoute(fromId: string, toId: string): RouteResult | null {
  if (fromId === toId) return null;
  if (!STATIONS[fromId] || !STATIONS[toId]) return null;

  const graph = getGraph();
  const linesAt = getStationLines();
  const fromLines = linesAt.get(fromId) ?? [];
  const toLines = linesAt.get(toId) ?? [];
  if (fromLines.length === 0 || toLines.length === 0) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, PrevEntry>();
  const visited = new Set<string>();

  // Simple binary heap
  const heap: Array<[number, string]> = [];
  const push = (d: number, n: string) => {
    heap.push([d, n]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, string] | undefined => {
    if (heap.length === 0) return undefined;
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  for (const l of fromLines) {
    const key = nodeKey(fromId, l);
    dist.set(key, 0);
    push(0, key);
  }

  const targets = new Set(toLines.map((l) => nodeKey(toId, l)));
  let found: string | null = null;

  for (;;) {
    const top = pop();
    if (!top) break;
    const [d, node] = top;
    if (visited.has(node)) continue;
    visited.add(node);
    if (targets.has(node)) {
      found = node;
      break;
    }
    for (const edge of graph.get(node) ?? []) {
      const nd = d + edge.minutes;
      if (nd < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nd);
        prev.set(edge.to, { node, kind: edge.kind, minutes: edge.minutes });
        push(nd, edge.to);
      }
    }
  }

  if (!found) return null;

  // Reconstruct node path
  const path: Array<{ node: string; kind: Edge["kind"] | "start" }> = [];
  let cur: string | null = found;
  while (cur) {
    const p: PrevEntry | undefined = prev.get(cur);
    path.push({ node: cur, kind: p ? p.kind : "start" });
    cur = p ? p.node : null;
  }
  path.reverse();

  // Collapse into legs
  const legs: RouteLeg[] = [];
  const parse = (n: string) => {
    const at = n.lastIndexOf("@");
    return { station: n.slice(0, at), line: n.slice(at + 1) };
  };

  for (let i = 1; i < path.length; i++) {
    const { node, kind } = path[i];
    const { station, line } = parse(node);
    const prevStation = parse(path[i - 1].node).station;

    if (kind === "ride") {
      const last = legs[legs.length - 1];
      if (last && last.kind === "ride" && last.lineId === line) {
        last.stations.push(station);
        last.minutes += hopMinutes(prevStation, station);
      } else {
        legs.push({
          kind: "ride",
          lineId: line,
          stations: [prevStation, station],
          minutes: hopMinutes(prevStation, station),
        });
      }
    } else if (kind === "walk") {
      legs.push({
        kind: "walk",
        stations: [prevStation, station],
        minutes:
          (TRANSFERS.find(
            (t) =>
              (t.a === prevStation && t.b === station) ||
              (t.b === prevStation && t.a === station),
          )?.minutes ?? 3) ,
      });
    }
    // same-station "transfer" edges don't produce a leg — the line change
    // is visible from consecutive ride legs; time is still counted below.
  }

  const rideLegs = legs.filter((l) => l.kind === "ride");
  if (rideLegs.length === 0) return null;

  const totalMinutes = dist.get(found)!;
  const transfers = rideLegs.length - 1;

  return {
    from: fromId,
    to: toId,
    legs,
    totalMinutes: Math.round(totalMinutes),
    transfers,
  };
}

/** Validate dataset integrity — every line references existing stations. */
export function validateData(): string[] {
  const problems: string[] = [];
  for (const line of LINES) {
    for (const st of line.stations) {
      if (!STATIONS[st]) problems.push(`Line ${line.id}: unknown station "${st}"`);
    }
    if (new Set(line.stations).size !== line.stations.length && !line.loop) {
      problems.push(`Line ${line.id}: duplicate stations`);
    }
  }
  for (const t of TRANSFERS) {
    if (!STATIONS[t.a]) problems.push(`Transfer: unknown station "${t.a}"`);
    if (!STATIONS[t.b]) problems.push(`Transfer: unknown station "${t.b}"`);
  }
  for (const id of Object.keys(LINE_MAP)) {
    if (LINE_MAP[id].stations.length < 2) problems.push(`Line ${id}: too few stations`);
  }
  return problems;
}
