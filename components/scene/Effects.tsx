"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.25}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.35}
        mipmapBlur
        radius={0.8}
      />
      <Vignette eskil={false} offset={0.16} darkness={0.82} />
    </EffectComposer>
  );
}
