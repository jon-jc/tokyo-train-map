"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { STATIONS } from "@/lib/data/stations";
import { getStationNode } from "@/lib/three/network";
import { getLabelSprite } from "@/lib/three/textSprite";
import { useMapStore } from "@/lib/store";

const LABEL_HEIGHT = 7;

function StationLabel({
  id,
  accent,
  scale = 1,
}: {
  id: string;
  accent?: string;
  scale?: number;
}) {
  const st = STATIONS[id];
  const node = getStationNode(id);
  const sprite = useMemo(
    () => getLabelSprite(`${id}|${accent ?? ""}`, st.name, st.nameJa, accent),
    [id, st, accent],
  );
  if (!node) return null;

  const h = 8.5 * scale;
  return (
    <sprite
      position={[node.x, Math.max(node.maxY, 0) + LABEL_HEIGHT, node.z]}
      scale={[h * sprite.aspect, h, 1]}
      raycast={() => null}
    >
      <spriteMaterial
        map={sprite.texture}
        transparent
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </sprite>
  );
}

export default function Labels() {
  const showLabels = useMapStore((s) => s.showLabels);
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const from = useMapStore((s) => s.from);
  const to = useMapStore((s) => s.to);

  const majors = useMemo(
    () =>
      Object.values(STATIONS)
        .filter((s) => s.major)
        .map((s) => s.id),
    [],
  );

  const dynamic = new Set<string>();
  if (hovered) dynamic.add(hovered);
  if (selected) dynamic.add(selected);
  if (from) dynamic.add(from);
  if (to) dynamic.add(to);

  return (
    <group>
      {showLabels &&
        majors
          .filter((id) => !dynamic.has(id))
          .map((id) => <StationLabel key={id} id={id} />)}
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
