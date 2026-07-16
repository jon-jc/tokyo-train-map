"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { getStationNodes } from "@/lib/three/network";
import { useMapStore } from "@/lib/store";

const C_DEFAULT = new THREE.Color("#0e7f96");
const C_MAJOR = new THREE.Color("#19c8e8");
const C_HOVER = new THREE.Color("#ffffff");
const C_SELECTED = new THREE.Color("#ff2e88");
const C_FROM = new THREE.Color("#2bff88");
const C_TO = new THREE.Color("#ff2e88");
const C_ROUTE = new THREE.Color("#ffd60a");

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

export default function StationNodes() {
  const nodes = useMemo(() => getStationNodes(), []);
  const discRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const pillarRef = useRef<THREE.InstancedMesh>(null);
  const hitRef = useRef<THREE.InstancedMesh>(null);

  const setHovered = useMapStore((s) => s.setHovered);
  const select = useMapStore((s) => s.select);

  // Pillars only where the station spans vertical layers or is an interchange
  const pillarNodes = useMemo(
    () => nodes.filter((n) => n.lineIds.length > 1 || n.maxY - n.minY > 5),
    [nodes],
  );

  // Static transforms
  useEffect(() => {
    const disc = discRef.current;
    const ring = ringRef.current;
    const pillar = pillarRef.current;
    const hit = hitRef.current;
    if (!disc || !ring || !pillar || !hit) return;

    const flat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, 0),
    );

    nodes.forEach((n, i) => {
      const r = n.major ? 2.6 : n.lineIds.length > 1 ? 1.8 : 1.25;
      tmpMatrix.compose(
        tmpPos.set(n.x, 0.25, n.z),
        flat,
        tmpScale.set(r, r, r),
      );
      disc.setMatrixAt(i, tmpMatrix);
      ring.setMatrixAt(i, tmpMatrix);
      // generous invisible hit target
      const hr = Math.max(r * 2.4, 4.5);
      tmpMatrix.compose(
        tmpPos.set(n.x, 0.25, n.z),
        flat,
        tmpScale.set(hr, hr, hr),
      );
      hit.setMatrixAt(i, tmpMatrix);
    });

    pillarNodes.forEach((n, i) => {
      const h = Math.max(n.maxY - n.minY, 2);
      tmpMatrix.compose(
        tmpPos.set(n.x, (n.minY + n.maxY) / 2, n.z),
        tmpQuat.identity(),
        tmpScale.set(1, h, 1),
      );
      pillar.setMatrixAt(i, tmpMatrix);
    });

    disc.instanceMatrix.needsUpdate = true;
    ring.instanceMatrix.needsUpdate = true;
    pillar.instanceMatrix.needsUpdate = true;
    hit.instanceMatrix.needsUpdate = true;
    disc.computeBoundingSphere();
    ring.computeBoundingSphere();
    pillar.computeBoundingSphere();
    hit.computeBoundingSphere();
  }, [nodes, pillarNodes]);

  // Per-frame colors (cheap: only recolor when interaction state changes)
  const lastStateKey = useRef("");
  useFrame(() => {
    const disc = discRef.current;
    const ring = ringRef.current;
    const pillar = pillarRef.current;
    if (!disc || !ring || !pillar) return;

    const { hovered, selected, from, to, route } = useMapStore.getState();
    const routeStations = new Set<string>();
    if (route) {
      for (const leg of route.legs) {
        for (const s of leg.stations) routeStations.add(s);
      }
    }
    const stateKey = `${hovered}|${selected}|${from}|${to}|${route ? route.from + route.to : ""}`;
    if (stateKey === lastStateKey.current) return;
    lastStateKey.current = stateKey;

    const colorFor = (id: string, major: boolean): THREE.Color => {
      if (id === hovered) return C_HOVER;
      if (id === from) return C_FROM;
      if (id === to) return C_TO;
      if (id === selected) return C_SELECTED;
      if (routeStations.has(id)) return C_ROUTE;
      return major ? C_MAJOR : C_DEFAULT;
    };

    nodes.forEach((n, i) => {
      const c = colorFor(n.id, n.major);
      disc.setColorAt(i, c);
      ring.setColorAt(i, c);
    });
    pillarNodes.forEach((n, i) => {
      pillar.setColorAt(i, colorFor(n.id, n.major));
    });

    if (disc.instanceColor) disc.instanceColor.needsUpdate = true;
    if (ring.instanceColor) ring.instanceColor.needsUpdate = true;
    if (pillar.instanceColor) pillar.instanceColor.needsUpdate = true;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    setHovered(nodes[e.instanceId].id);
    document.body.style.cursor = "pointer";
  };

  const onOut = () => {
    setHovered(null);
    document.body.style.cursor = "";
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    select(nodes[e.instanceId].id);
  };

  return (
    <group>
      {/* invisible, generously sized hit targets */}
      <instancedMesh
        ref={hitRef}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* glow discs at ground level */}
      <instancedMesh
        ref={discRef}
        args={[undefined, undefined, nodes.length]}
        raycast={() => null}
      >
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          transparent
          opacity={0.55}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* halo rings */}
      <instancedMesh
        ref={ringRef}
        args={[undefined, undefined, nodes.length]}
        raycast={() => null}
      >
        <ringGeometry args={[1.35, 1.6, 32]} />
        <meshBasicMaterial
          transparent
          opacity={0.85}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* vertical data pillars linking underground and elevated layers */}
      <instancedMesh
        ref={pillarRef}
        args={[undefined, undefined, pillarNodes.length]}
        raycast={() => null}
      >
        <cylinderGeometry args={[0.22, 0.22, 1, 6, 1, true]} />
        <meshBasicMaterial
          transparent
          opacity={0.16}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
