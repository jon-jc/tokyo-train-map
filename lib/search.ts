import { STATION_LIST } from "./data/stations";
import type { StationDef } from "./data/types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ōô]/g, "o")
    .replace(/[ūû]/g, "u")
    .replace(/[\s'’-]/g, "");

/**
 * Rank stations against a query: exact > prefix > substring,
 * matching romaji, Japanese, and id.
 */
export function searchStations(query: string, limit = 8): StationDef[] {
  const q = norm(query);
  if (!q) return [];

  const scored: Array<{ st: StationDef; score: number }> = [];
  for (const st of STATION_LIST) {
    const name = norm(st.name);
    const ja = st.nameJa;
    const id = norm(st.id);

    let score = -1;
    if (name === q || ja === query.trim() || id === q) score = 100;
    else if (name.startsWith(q) || ja.startsWith(query.trim()) || id.startsWith(q))
      score = 60;
    else if (name.includes(q) || ja.includes(query.trim()) || id.includes(q))
      score = 30;

    if (score >= 0) {
      if (st.major) score += 8;
      scored.push({ st, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.st.name.localeCompare(b.st.name))
    .slice(0, limit)
    .map((x) => x.st);
}
