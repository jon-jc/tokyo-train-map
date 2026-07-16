"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useMapStore } from "@/lib/store";

/** Deterministic PRNG so the skyline is stable between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNT = 900;

/** Skyline hotspots roughly matching Tokyo's dense districts (scene XZ). */
const HOTSPOTS: Array<[number, number, number]> = [
  [-113, -12, 63], // Shinjuku
  [-111, 76, 55], // Shibuya
  [-91, -124, 58], // Ikebukuro
  [36, 11, 60], // Marunouchi / Tokyo
  [32, 52, 50], // Ginza / Shimbashi
  [-44, 62, 47], // Roppongi
  [58, -83, 47], // Ueno / Asakusa
  [52, 144, 55], // Odaiba / waterfront
  [-28, 158, 41], // Shinagawa
];

export default function CityBlocks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const showBuildings = useMapStore((s) => s.showBuildings);
  const viewMode = useMapStore((s) => s.viewMode);
  const visible = showBuildings && viewMode !== "underground";

  const { matrices, colors } = useMemo(() => {
    const rand = mulberry32(20260715);
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const m = new THREE.Matrix4();

    const cool = new THREE.Color("#123252");
    const warm = new THREE.Color("#33254d");

    for (let i = 0; i < COUNT; i++) {
      const spot = HOTSPOTS[Math.floor(rand() * HOTSPOTS.length)];
      const ang = rand() * Math.PI * 2;
      const rr = Math.pow(rand(), 0.55) * spot[2];
      const x = spot[0] + Math.cos(ang) * rr + (rand() - 0.5) * 14;
      const z = spot[1] + Math.sin(ang) * rr + (rand() - 0.5) * 14;

      const centerBoost = Math.max(0, 1 - Math.hypot(x - spot[0], z - spot[1]) / spot[2]);
      const h = 2.5 + rand() * 9 + centerBoost * rand() * 26;
      const w = 2.2 + rand() * 4.5;
      const d = 2.2 + rand() * 4.5;

      pos.set(x, h / 2, z);
      quat.identity();
      scale.set(w, h, d);
      matrices.push(m.clone().compose(pos, quat, scale));

      const c = cool.clone().lerp(warm, rand());
      c.multiplyScalar(0.55 + rand() * 0.7 + (h > 22 ? 0.35 : 0));
      colors.push(c);
    }
    return { matrices, colors };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    colors.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      visible={visible}
      raycast={() => null}
      renderOrder={2}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        transparent
        opacity={0.22}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
