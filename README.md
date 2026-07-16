# NEO TOKYO TRANSIT — 東京交通網

A cyberpunk, fully explorable **3D map of Tokyo's rail and subway network** that doubles as a
practical journey planner. Fly through a neon wireframe of the city, watch trains run every
line in real time, and plan real routes across JR, Tokyo Metro, Toei, Yurikamome and Rinkai.

**Live demo:** https://jon-jc.github.io/tokyo-train-map/

![CI/CD](https://github.com/jon-jc/tokyo-train-map/actions/workflows/ci.yml/badge.svg)

---

## Features

### Explorable 3D network
- **20 lines, 213 stations** with real geographic coordinates and bilingual (EN/JA) names
- Vertically layered network — elevated JR and Yurikamome viaducts above the ground grid,
  each subway line at its own stacked depth (the Oedo line is the deepest, as in real life)
- Neon "data pillars" rise through interchanges, connecting underground and surface layers
- Animated trains run every line bidirectionally at realistic speeds, loop-aware on the
  Yamanote and Oedo circles
- Holographic city blocks seeded around real districts (Shinjuku, Shibuya, Marunouchi,
  Odaiba…), shader-driven ground grid with radar pulse, bloom, fog and scanlines

### A real navigation tool
- **Route planner** — Dijkstra pathfinding over a (station × line) graph with realistic
  transfer penalties and designated out-of-station walking transfers
  (Otemachi ⇄ Tokyo, Hibiya ⇄ Yurakucho, Hamamatsucho ⇄ Daimon, …)
- Results show total time, transfer count, per-leg line badges, stop-by-stop breakdown
  and walking segments; the 3D scene dims to the route with energy-flow tubes,
  transfer beams and pulsing origin/destination markers
- **Bilingual fuzzy search** (romaji or Japanese) with keyboard navigation
- **Station cards** — serving lines, operators, one-tap set-origin / set-destination
- **Line filters** — toggle any line or whole operator group (JR / Metro / Toei / Waterfront)
- Click any station to fly the camera to it; live JST clock

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 15 (App Router, static export) + React 19 + TypeScript |
| 3D | three.js via @react-three/fiber, drei, postprocessing |
| State | zustand |
| Testing | Vitest — dataset integrity, geo projection, routing invariants |
| CI/CD | GitHub Actions — test → build → deploy to GitHub Pages |

## Architecture

```
lib/
  data/        stations.ts, lines.ts — the hand-curated network dataset
  geo.ts       WGS84 → scene projection (55 m per world unit)
  graph.ts     routing graph + Dijkstra with transfer penalties
  search.ts    bilingual fuzzy station search
  store.ts     UI/scene shared state (zustand)
  three/       cached curves, station nodes, canvas label sprites
components/
  scene/       Canvas, network tubes, stations, trains, route highlight,
               ground shader, city blocks, camera rig, post-processing
  ui/          HUD, search inputs, route panel, station card, legend
```

Every line is a Catmull-Rom curve through its stations at its elevation layer; trains and
the route highlighter travel the same curves, so the picture and the planner can never
disagree.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run check-data # dataset integrity + routing smoke test
npm run build      # production build
```

## Data notes

The dataset covers the core network inside (and slightly beyond) the Yamanote loop —
all 9 Tokyo Metro lines, all 4 Toei lines, the central JR lines (Yamanote, Chuo Rapid,
Chuo-Sobu Local, Keihin-Tohoku, Saikyo), plus Yurikamome and Rinkai. Coordinates are
approximate and tuned for readability; travel times are estimates derived from
inter-station distance and should not replace official timetables. Suburban tails of
some lines are truncated at sensible boundaries to keep the map focused.

## License

MIT
