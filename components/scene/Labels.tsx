"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { STATIONS } from "@/lib/data/stations";
import { getStationNode, getStationNodes } from "@/lib/three/network";
import { getLabelSprite } from "@/lib/three/textSprite";
import { useMapStore, lineInMode } from "@/lib/store";
import { stationName, stationNameAlt } from "@/lib/i18n";

const LABEL_HEIGHT = 7;
/** Camera-to-target distance below which nearby minor stations get labels */
const PROXIMITY_DISTANCE = 440;
const PROXIMITY_MAX = 48;

function StationLabel({
  id,
  accent,
  scale = 1,
}: {
  id: string;
  accent?: string;
  scale?: number;
}) {
  const lang = useMapStore((s) => s.lang);
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const st = STATIONS[id];
  const node = getStationNode(id);
  const sprite = useMemo(
    () =>
      getLabelSprite(
        `${id}|${lang}|${accent ?? ""}`,
        stationName(st, lang),
        stationNameAlt(st, lang),
        accent,
      ),
    [id, st, accent, lang],
  );

  // Fade in on mount
  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    if (mat.opacity < 1) mat.opacity = Math.min(1, mat.opacity + 0.07);
  });

  if (!node) return null;

  const h = 8.5 * scale;
  return (
    <sprite
      position={[node.x, Math.max(node.maxY, 0) + LABEL_HEIGHT, node.z]}
      scale={[h * sprite.aspect, h, 1]}
      raycast={() => null}
    >
      <spriteMaterial
        ref={matRef}
        map={sprite.texture}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </sprite>
  );
}

/**
 * Tracks the camera and reveals every station near the focus point once the
 * viewer is zoomed in — so no stop on any line stays unnamed up close.
 */
function useProximityIds(): string[] {
  const viewMode = useMapStore((s) => s.viewMode);
  const [ids, setIds] = useState<string[]>([]);
  const cooldown = useRef(0);
  const lastKey = useRef("");

  useFrame((state, delta) => {
    cooldown.current -= delta;
    if (cooldown.current > 0) return;
    cooldown.current = 0.25;

    const controls = state.controls as unknown as {
      target?: THREE.Vector3;
    } | null;
    const target = controls?.target;
    if (!target) return;

    const dist = state.camera.position.distanceTo(target);
    let next: string[] = [];
    if (dist < PROXIMITY_DISTANCE) {
      const radius = Math.max(70, dist * 0.8);
      const r2 = radius * radius;
      next = getStationNodes()
        .filter((n) => n.lineIds.some((l) => lineInMode(l, viewMode)))
        .map((n) => ({
          id: n.id,
          d2: (n.x - target.x) ** 2 + (n.z - target.z) ** 2,
        }))
        .filter((n) => n.d2 < r2)
        .sort((a, b) => a.d2 - b.d2)
        .slice(0, PROXIMITY_MAX)
        .map((n) => n.id);
    }
    const key = next.join(",");
    if (key !== lastKey.current) {
      lastKey.current = key;
      setIds(next);
    }
  });

  return ids;
}

export default function Labels() {
  const showLabels = useMapStore((s) => s.showLabels);
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const from = useMapStore((s) => s.from);
  const to = useMapStore((s) => s.to);
  const viewMode = useMapStore((s) => s.viewMode);
  const proximityIds = useProximityIds();

  const majors = useMemo(() => {
    const nodes = getStationNodes();
    const ids: string[] = [];
    for (const n of nodes) {
      const inMode = n.lineIds.filter((l) => lineInMode(l, viewMode));
      if (inMode.length === 0) continue;
      if (STATIONS[n.id].major) {
        ids.push(n.id);
      } else if (viewMode === "underground" && inMode.length >= 2) {
        // In metro view, label every subway interchange for readability
        ids.push(n.id);
      }
    }
    return ids;
  }, [viewMode]);

  const dynamic = new Set<string>();
  if (hovered) dynamic.add(hovered);
  if (selected) dynamic.add(selected);
  if (from) dynamic.add(from);
  if (to) dynamic.add(to);

  const majorSet = new Set(majors);
  const nearby = showLabels
    ? proximityIds.filter((id) => !majorSet.has(id) && !dynamic.has(id))
    : [];

  return (
    <group>
      {showLabels &&
        majors
          .filter((id) => !dynamic.has(id))
          .map((id) => <StationLabel key={id} id={id} />)}
      {nearby.map((id) => (
        <StationLabel key={id} id={id} scale={0.72} />
      ))}
      {from && <StationLabel id={from} accent="#2bff88" scale={1.15} />}
      {to && <StationLabel id={to} accent="#ff2e88" scale={1.15} />}
      {selected && selected !== from && selected !== to && (
        <StationLabel id={selected} accent="#ff2e88" scale={1.1} />
      )}
      {hovered &&
        hovered !== selected &&
        hovered !== from &&
        hovered !== to && <StationLabel id={hovered} scale={1.05} />}
    </group>
  );
}
