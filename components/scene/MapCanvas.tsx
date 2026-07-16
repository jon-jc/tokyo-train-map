"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Ground from "./Ground";
import CityBlocks from "./CityBlocks";
import NetworkLines from "./NetworkLines";
import StationNodes from "./StationNodes";
import Trains from "./Trains";
import Labels from "./Labels";
import RouteHighlight from "./RouteHighlight";
import CameraRig from "./CameraRig";
import Effects from "./Effects";
import { useMapStore } from "@/lib/store";

export default function MapCanvas() {
  const select = useMapStore((s) => s.select);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 1, far: 4000, position: [40, 300, 420] }}
      onPointerMissed={() => select(null, false)}
    >
      <color attach="background" args={["#02040a"]} />
      <fogExp2 attach="fog" args={["#02040a", 0.00085]} />

      <Ground />
      <CityBlocks />
      <NetworkLines />
      <StationNodes />
      <Trains />
      <RouteHighlight />
      <Labels />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        maxPolarAngle={Math.PI * 0.495}
        minDistance={20}
        maxDistance={1100}
        target={[0, 0, 0]}
      />
      <CameraRig />
      <Effects />
    </Canvas>
  );
}
