"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useMapStore } from "@/lib/store";

const FLY_SECONDS = 1.5;
const ARRIVE_DISTANCE = 130;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface Flight {
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  t: number;
}

export default function CameraRig() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const flight = useRef<Flight | null>(null);
  const lastKey = useRef(0);

  const focus = useMapStore((s) => s.focus);

  useEffect(() => {
    if (!focus || !controls || focus.key === lastKey.current) return;
    lastKey.current = focus.key;

    const toTarget = new THREE.Vector3(...focus.target);
    const fromTarget = controls.target.clone();
    const fromPos = camera.position.clone();

    // Approach from the current viewing direction, but pulled to a
    // comfortable inspection distance and guaranteed height.
    const dir = fromPos.clone().sub(fromTarget);
    if (dir.lengthSq() < 1) dir.set(0, 1, 1);
    dir.normalize();
    const toPos = toTarget
      .clone()
      .add(dir.multiplyScalar(ARRIVE_DISTANCE));
    toPos.y = Math.max(toPos.y, 70);

    flight.current = { fromTarget, toTarget, fromPos, toPos, t: 0 };
  }, [focus, controls, camera]);

  useFrame((_, delta) => {
    const f = flight.current;
    if (!f || !controls) return;
    f.t = Math.min(1, f.t + delta / FLY_SECONDS);
    const k = easeInOutCubic(f.t);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    camera.position.lerpVectors(f.fromPos, f.toPos, k);
    controls.update();
    if (f.t >= 1) flight.current = null;
  });

  return null;
}
