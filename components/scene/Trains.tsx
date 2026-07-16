"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getLineGeometries, type LineGeometry } from "@/lib/three/network";
import { useMapStore, routeLineIds } from "@/lib/store";

/** world units per second — ~60 km/h at 55 m per unit */
const SPEED = 0.31;

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3(1, 1, 1);
/** CapsuleGeometry's long axis is Y */
const FORWARD = new THREE.Vector3(0, 1, 0);

interface TrainState {
  u: number;
  dir: 1 | -1;
}

function LineTrains({ geom }: { geom: LineGeometry }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { line, curve, length } = geom;

  const count = Math.min(8, Math.max(2, Math.floor(line.stations.length / 4)));

  const trains = useMemo<TrainState[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        u: i / count,
        dir: i % 2 === 0 ? 1 : -1,
      })),
    [count],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { hiddenLines, route } = useMapStore.getState();
    const activeIds = routeLineIds(route);
    const dimmed = route ? !activeIds.has(line.id) : false;
    mesh.visible = hiddenLines[line.id] !== true && !dimmed;
    if (!mesh.visible) return;

    const du = (SPEED * delta * 60) / length;

    trains.forEach((t, i) => {
      if (curve.closed) {
        t.u = (t.u + du * t.dir + 1) % 1;
      } else {
        t.u += du * t.dir;
        if (t.u >= 1) {
          t.u = 1;
          t.dir = -1;
        } else if (t.u <= 0) {
          t.u = 0;
          t.dir = 1;
        }
      }

      curve.getPointAt(t.u, tmpPos);
      const tangent = curve.getTangentAt(t.u);
      tmpQuat.setFromUnitVectors(FORWARD, tangent.multiplyScalar(t.dir));
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      raycast={() => null}
      frustumCulled={false}
    >
      <capsuleGeometry args={[0.55, 2.6, 4, 8]} />
      <meshBasicMaterial color={line.color} toneMapped={false} />
    </instancedMesh>
  );
}

export default function Trains() {
  const geoms = useMemo(() => getLineGeometries(), []);
  return (
    <group>
      {geoms.map((g) => (
        <LineTrains key={g.line.id} geom={g} />
      ))}
    </group>
  );
}
