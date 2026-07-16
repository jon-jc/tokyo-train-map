"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useMapStore } from "@/lib/store";

const FLY_SECONDS = 1.5;
const INTRO_SECONDS = 3.2;
const ARRIVE_DISTANCE = 180;

/**
 * Where the intro flight lands — frames the Yamanote core at a distance
 * where station labels stay clearly separated; pan/zoom out for suburbs.
 */
export const HOME_POSITION = new THREE.Vector3(-49, 300, 465);
export const HOME_TARGET = new THREE.Vector3(-29, 0, 50);

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface Flight {
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  /** extra height added at the flight midpoint */
  arc: number;
  seconds: number;
  t: number;
}

export default function CameraRig() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const flight = useRef<Flight | null>(null);
  const lastKey = useRef(0);
  const introDone = useRef(false);

  const focus = useMapStore((s) => s.focus);

  // Cinematic intro: swoop from the opening high orbit down to the home view
  useEffect(() => {
    if (!controls || introDone.current) return;
    introDone.current = true;
    flight.current = {
      fromTarget: controls.target.clone(),
      toTarget: HOME_TARGET.clone(),
      fromPos: camera.position.clone(),
      toPos: HOME_POSITION.clone(),
      arc: 0,
      seconds: INTRO_SECONDS,
      t: 0,
    };
  }, [controls, camera]);

  // A user grab cancels any scripted flight immediately
  useEffect(() => {
    if (!controls) return;
    const cancel = () => {
      flight.current = null;
    };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

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
    const toPos = toTarget.clone().add(dir.multiplyScalar(ARRIVE_DISTANCE));
    toPos.y = Math.max(toPos.y, 70);

    // Long hops get a graceful vertical arc
    const travel = fromPos.distanceTo(toPos);
    const arc = Math.min(120, travel * 0.18);

    flight.current = {
      fromTarget,
      toTarget,
      fromPos,
      toPos,
      arc,
      seconds: FLY_SECONDS,
      t: 0,
    };
  }, [focus, controls, camera]);

  useFrame((_, delta) => {
    const f = flight.current;
    if (!f || !controls) return;
    f.t = Math.min(1, f.t + delta / f.seconds);
    const k = easeInOutCubic(f.t);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    camera.position.lerpVectors(f.fromPos, f.toPos, k);
    camera.position.y += Math.sin(Math.PI * k) * f.arc;
    controls.update();
    if (f.t >= 1) flight.current = null;
  });

  return null;
}
