"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMapStore } from "@/lib/store";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDim;
  varying vec3 vWorld;

  float gridLine(vec2 p, float cell, float width) {
    vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
    float d = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, width, d);
  }

  void main() {
    float r = length(vWorld.xz);
    float fade = 1.0 - smoothstep(280.0, 780.0, r);

    float fine = gridLine(vWorld.xz, 18.0, 0.35) * 0.16;
    float coarse = gridLine(vWorld.xz, 90.0, 0.7) * 0.32;

    // radar pulse expanding from the center
    float pulseR = mod(uTime * 55.0, 700.0);
    float pulse = exp(-abs(r - pulseR) * 0.045) * 0.35 * (1.0 - pulseR / 800.0);

    vec3 cyan = vec3(0.0, 0.94, 1.0);
    vec3 base = vec3(0.008, 0.016, 0.035);
    vec3 col = base + cyan * (fine + coarse) * 0.8 + cyan * pulse;

    float alpha = (0.42 + (fine + coarse) * 1.4 + pulse) * fade * uDim;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.9));
  }
`;

export default function Ground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uDim: { value: 1 } }),
    [],
  );

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value += delta;
    // X-ray the ground when the metro level is isolated
    const target = useMapStore.getState().viewMode === "underground" ? 0.35 : 1;
    const d = mat.uniforms.uDim;
    d.value += (target - d.value) * 0.1;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
      <planeGeometry args={[1700, 1700, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
