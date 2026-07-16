"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Ground from "./Ground";
import CityBlocks from "./CityBlocks";
import NetworkLines from "./NetworkLines";
import StationNodes from "./StationNodes";
import Trains from "./Trains";
import Labels from "./Labels";
import RouteHighlight from "./RouteHighlight";
import SelectedPulse from "./SelectedPulse";
import CameraRig from "./CameraRig";
import Effects from "./Effects";
import { useMapStore } from "@/lib/store";

export default function MapCanvas() {
  const select = useMapStore((s) => s.select);
  const [autoRotate, setAutoRotate] = useState(true);

  // Stop the cinematic drift as soon as the user flies somewhere
  useEffect(
    () =>
      useMapStore.subscribe((s, prev) => {
        if (s.focus !== prev.focus) setAutoRotate(false);
      }),
    [],
  );

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 1, far: 7000, position: [-500, 1000, 1350] }}
      onPointerMissed={() => select(null, false)}
    >
      <color attach="background" args={["#02040a"]} />
      <fogExp2 attach="fog" args={["#02040a", 0.00045]} />

      <Ground />
      <CityBlocks />
      <NetworkLines />
      <StationNodes />
      <Trains />
      <RouteHighlight />
      <SelectedPulse />
      <Labels />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        maxPolarAngle={Math.PI * 0.495}
        minDistance={25}
        maxDistance={2100}
        target={[-29, 0, 50]}
        autoRotate={autoRotate}
        autoRotateSpeed={-0.4}
        onStart={() => setAutoRotate(false)}
      />
      <CameraRig />
      <Effects />
    </Canvas>
  );
}
