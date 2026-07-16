"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getLineGeometries } from "@/lib/three/network";
import { useMapStore, routeLineIds, lineInMode } from "@/lib/store";

const DIMMED_OPACITY = 0.05;

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

  const baseOpacity = underground ? 0.8 : 0.95;

  useFrame(() => {
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
