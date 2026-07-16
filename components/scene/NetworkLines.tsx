"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getLineGeometries } from "@/lib/three/network";
import { useMapStore, routeLineIds, lineInMode } from "@/lib/store";

const DIMMED_OPACITY = 0.05;

/**
 * Shared 1D streak pattern scrolled along every tube — a faint energy
 * current that keeps the whole network alive.
 */
let streakImage: ImageData["data"] | null = null;

function makeFlowTexture(repeats: number): THREE.DataTexture {
  const w = 128;
  if (!streakImage) {
    const data = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      const t = i / w;
      // base brightness with two soft travelling pulses
      const pulse =
        Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 12) * 70 +
        Math.pow(Math.max(0, Math.sin((t + 0.42) * Math.PI * 2)), 24) * 45;
      const v = Math.min(255, 200 + pulse);
      data[i * 4 + 0] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    streakImage = data as unknown as ImageData["data"];
  }
  const tex = new THREE.DataTexture(
    streakImage as unknown as Uint8Array,
    w,
    1,
    THREE.RGBAFormat,
  );
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeats, 1);
  return tex;
}

function LineTube({
  lineId,
  curve,
  color,
  stations,
  underground,
}: {
  lineId: string;
  curve: THREE.CatmullRomCurve3;
  color: string;
  stations: number;
  underground: boolean;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        curve,
        Math.max(64, stations * 14),
        0.75,
        10,
        curve.closed,
      ),
    [curve, stations],
  );

  const flowTexture = useMemo(
    () => makeFlowTexture(Math.max(3, Math.round(curve.getLength() / 55))),
    [curve],
  );

  const baseOpacity = underground ? 0.8 : 0.95;

  useFrame((_, delta) => {
    flowTexture.offset.x -= delta * 0.11;
    const mat = matRef.current;
    if (!mat) return;
    const { route, hiddenLines, viewMode } = useMapStore.getState();
    const activeIds = routeLineIds(route);
    const hidden =
      hiddenLines[lineId] === true || !lineInMode(lineId, viewMode);
    // Underground lines render at full strength when the metro level is isolated
    const fullOpacity = viewMode === "underground" ? 1 : baseOpacity;
    const target = hidden
      ? 0
      : route && !activeIds.has(lineId)
        ? DIMMED_OPACITY
        : fullOpacity;
    mat.opacity += (target - mat.opacity) * 0.12;
    mat.visible = mat.opacity > 0.01;
  });

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        ref={matRef}
        color={color}
        map={flowTexture}
        transparent
        opacity={baseOpacity}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function NetworkLines() {
  const geoms = useMemo(() => getLineGeometries(), []);
  return (
    <group>
      {geoms.map(({ line, curve }) => (
        <LineTube
          key={line.id}
          lineId={line.id}
          curve={curve}
          color={line.color}
          stations={line.stations.length}
          underground={line.elevation < 0}
        />
      ))}
    </group>
  );
}
