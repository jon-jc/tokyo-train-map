"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getLineGeometries, type LineGeometry } from "@/lib/three/network";
import { useMapStore, routeLineIds, lineInMode } from "@/lib/store";

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
  const trailRef = useRef<THREE.InstancedMesh>(null);
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
    const trail = trailRef.current;
    if (!mesh || !trail) return;

    const { hiddenLines, route, viewMode } = useMapStore.getState();
    const activeIds = routeLineIds(route);
    const dimmed = route ? !activeIds.has(line.id) : false;
    const visible =
      hiddenLines[line.id] !== true &&
      !dimmed &&
      lineInMode(line.id, viewMode);
    mesh.visible = visible;
    trail.visible = visible;
    if (!visible) return;

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
      const tangent = curve.getTangentAt(t.u).multiplyScalar(t.dir);
      tmpQuat.setFromUnitVectors(FORWARD, tangent);
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);

      // Fading light-trail streaking behind the head
      tmpPos.addScaledVector(tangent, -3.4);
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      trail.setMatrixAt(i, tmpMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    trail.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        raycast={() => null}
        frustumCulled={false}
      >
        <capsuleGeometry args={[0.55, 2.6, 4, 8]} />
        <meshBasicMaterial color={line.color} toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={trailRef}
        args={[undefined, undefined, count]}
        raycast={() => null}
        frustumCulled={false}
      >
        <capsuleGeometry args={[0.42, 5.2, 3, 6]} />
        <meshBasicMaterial
          color={line.color}
          transparent
          opacity={0.22}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
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
