"use client";

import { Canvas } from "@react-three/fiber";
import { Drink, StudioLights, Toast, type Flavor } from "./WobbleScene";

export default function ProductArt({ kind }: { kind: Flavor }) {
  return <span className="product-art" aria-hidden="true">
    <Canvas frameloop="demand" dpr={1} camera={{ position: kind === "toast" ? [2.8, 4, 4.5] : [0, 3, 7], fov: 31 }} gl={{ alpha: true, antialias: true }}>
      <StudioLights/>{kind === "toast" ? <Toast/> : <Drink flavor={kind}/>}
    </Canvas>
  </span>;
}
