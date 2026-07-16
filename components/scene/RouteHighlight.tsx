"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LINE_MAP } from "@/lib/data/lines";
import { stationXZ } from "@/lib/geo";
import { getStationNode } from "@/lib/three/network";
import { useMapStore } from "@/lib/store";
import type { RouteLeg } from "@/lib/graph";

/** Scrolling energy-flow texture shared by all route tubes. */
function makeFlowTexture(): THREE.DataTexture {
  const w = 64;
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i++) {
    const t = i / w;
    const a = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 3);
    data[i * 4 + 0] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = 60 + a * 195;
  }
  const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function RideLegTube({ leg, legIndex }: { leg: RouteLeg; legIndex: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const drawn = useRef(0);
  const line = leg.lineId ? LINE_MAP[leg.lineId] : undefined;

  const { geometry, texture, indexCount } = useMemo(() => {
    const elev = line?.elevation ?? 0;
    const pts = leg.stations.map((id) => {
      const [x, z] = stationXZ(id);
      return new THREE.Vector3(x, elev, z);
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(32, leg.stations.length * 16),
      1.15,
      10,
      false,
    );
    const texture = makeFlowTexture();
    texture.repeat.set(Math.max(2, Math.round(curve.getLength() / 22)), 1);
    const indexCount = geometry.index?.count ?? 0;
    // Route draws itself on, one leg after another
    geometry.setDrawRange(0, 0);
    return { geometry, texture, indexCount };
  }, [leg, line]);

  useFrame((_, delta) => {
    texture.offset.x -= delta * 0.9;

    // Draw-on: each leg sweeps in over ~0.6s, staggered by leg order
    if (drawn.current < 1 + legIndex * 0.5) {
      drawn.current += delta / 0.6;
      const local = Math.min(1, Math.max(0, drawn.current - legIndex * 0.5));
      const eased = 1 - Math.pow(1 - local, 3);
      geometry.setDrawRange(0, Math.floor(indexCount * eased));
    }

    if (matRef.current) {
      matRef.current.opacity =
        0.85 + Math.sin(performance.now() / 300) * 0.12;
    }
  });

  return (
    <mesh geometry={geometry} renderOrder={10}>
      <meshBasicMaterial
        ref={matRef}
        color={line?.color ?? "#ffffff"}
        map={texture}
        transparent
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** Vertical beam at a transfer point between two legs at different depths. */
function TransferBeam({ stationId }: { stationId: string }) {
  const node = getStationNode(stationId);
  if (!node) return null;
  const h = Math.max(node.maxY - node.minY, 4) + 6;
  return (
    <mesh
      position={[node.x, (node.minY + node.maxY) / 2, node.z]}
      renderOrder={10}
      raycast={() => null}
    >
      <cylinderGeometry args={[0.7, 0.7, h, 8, 1, true]} />
      <meshBasicMaterial
        color="#ffd60a"
        transparent
        opacity={0.5}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Pulsing ring marking the origin / destination. */
function EndMarker({ stationId, color }: { stationId: string; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const node = getStationNode(stationId);

  useFrame(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const t = (performance.now() % 1600) / 1600;
    const s = 2.5 + t * 6;
    ring.scale.set(s, s, s);
    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.8;
  });

  if (!node) return null;
  return (
    <group position={[node.x, 0.4, node.z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.95, 1.15, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[2.1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function RouteHighlight() {
  const route = useMapStore((s) => s.route);

  const transferStations = useMemo(() => {
    if (!route) return [];
    const ids: string[] = [];
    for (let i = 1; i < route.legs.length; i++) {
      ids.push(route.legs[i].stations[0]);
      if (route.legs[i].kind === "walk") {
        const w = route.legs[i];
        ids.push(w.stations[w.stations.length - 1]);
      }
    }
    return Array.from(new Set(ids));
  }, [route]);

  if (!route) return null;

  return (
    <group>
      {route.legs
        .filter((l) => l.kind === "ride")
        .map((leg, i) => (
          <RideLegTube key={`${leg.lineId}-${i}`} leg={leg} legIndex={i} />
        ))}
      {transferStations.map((id) => (
        <TransferBeam key={id} stationId={id} />
      ))}
      <EndMarker stationId={route.from} color="#2bff88" />
      <EndMarker stationId={route.to} color="#ff2e88" />
    </group>
  );
}
