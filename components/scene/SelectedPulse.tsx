"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getStationNode } from "@/lib/three/network";
import { useMapStore } from "@/lib/store";

/** Expanding pulse rings radiating from the selected station. */
function PulseRing({ phase, color }: { phase: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const ring = ref.current;
    if (!ring) return;
    const t = ((performance.now() / 1900 + phase) % 1 + 1) % 1;
    const s = 2 + t * 11;
    ring.scale.set(s, s, s);
    (ring.material as THREE.MeshBasicMaterial).opacity =
      Math.pow(1 - t, 1.6) * 0.7;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[0.95, 1.12, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function SelectedPulse() {
  const selected = useMapStore((s) => s.selected);
  const from = useMapStore((s) => s.from);
  const to = useMapStore((s) => s.to);

  // Route endpoints already have their own markers
  if (!selected || selected === from || selected === to) return null;
  const node = getStationNode(selected);
  if (!node) return null;

  return (
    <group position={[node.x, 0.35, node.z]}>
      <PulseRing phase={0} color="#ff2e88" />
      <PulseRing phase={0.5} color="#00f0ff" />
    </group>
  );
}
