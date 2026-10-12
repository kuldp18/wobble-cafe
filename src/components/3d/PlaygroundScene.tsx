"use client";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { RoundedBox, ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { StudioLights } from "./WobbleScene";
import { stepJellies, type JellyBody as Body } from "./jellyPhysics";
import { useSceneVisibility } from "./useSceneVisibility";

type Jelly = { id: number; x: number; color: string; rotation: number };

type World = MutableRefObject<Map<number, Body>>;
const initial: Jelly[] = [
  { id: -1, x: 24, color: "#92b642", rotation: -15 },
  { id: -2, x: 49, color: "#ef897d", rotation: 22 },
  { id: -3, x: 75, color: "#f1bb3f", rotation: -22 },
  { id: -4, x: 27, color: "#ad8fbe", rotation: 16 },
  { id: -5, x: 53, color: "#83b9bd", rotation: -12 },
  { id: -6, x: 77, color: "#eab18b", rotation: 30 },
];

function BouncingJelly({ jelly, index, world, onRemove }: { jelly: Jelly; index: number; world: World; onRemove: (id: number) => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const state = useRef<Body>({ x: (jelly.x - 50) / 24, y: 1.6 + index * .32, z: index < 6 ? (index < 3 ? -.55 : .55) : Math.sin(index * 2.4) * .7, vx: 0, vy: 0, vz: 0, squish: 0, dragging: false, popping: false, lastX: 0, lastY: 0, spin: jelly.rotation * .017 });
  const gesture = useRef({ distance: 0, removed: false });
  useEffect(() => { const bodies = world.current; bodies.set(jelly.id, state.current); return () => { bodies.delete(jelly.id); }; }, [jelly.id, world]);
  useFrame(() => {
    if (!mesh.current) return;
    const p = state.current;
    if (p.popping && p.y < -2.5 && !gesture.current.removed) { gesture.current.removed = true; onRemove(jelly.id); }
    mesh.current.position.set(p.x, p.y, p.z);
    mesh.current.scale.set(1 + p.squish * .4, 1 - p.squish, 1 + p.squish * .4);
    mesh.current.rotation.set(.04, p.spin, THREE.MathUtils.clamp(p.vx * -.055, -.2, .2));
  });
  function down(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation(); const p = state.current;
    if (p.popping) return;
    p.dragging = true; p.lastX = e.clientX; p.lastY = e.clientY; p.vy = 0; gesture.current.distance = 0;
    (e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId);
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const p = state.current; if (!p.dragging) return; e.stopPropagation();
    const dx = e.clientX - p.lastX, dy = e.clientY - p.lastY;
    gesture.current.distance += Math.hypot(dx, dy);
    p.x = THREE.MathUtils.clamp(p.x + dx * .012, -3, 3);
    p.y = THREE.MathUtils.clamp(p.y - dy * .012, -.1, 2.6);
    p.vx = THREE.MathUtils.clamp(dx * .065, -4, 4); p.spin += dx * .01;
    p.lastX = e.clientX; p.lastY = e.clientY;
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const p = state.current; if (!p.dragging) return;
    p.dragging = false;
    if (gesture.current.distance < 8 || Math.hypot(p.x, p.z) > 1.82) {
      p.popping = true;
      p.vx = (p.x >= 0 ? 1 : -1) * 4.5;
      p.vz = p.z >= 0 ? 1.8 : -1.8;
      p.vy = 5.2;
      p.squish = .23;
    } else {
      p.vy = p.y < .15 ? 3.2 : .3;
    }
    (e.target as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture(e.pointerId);
  }
  return <RoundedBox ref={mesh} args={[.68, .64, .66]} radius={.13} smoothness={4} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <meshPhysicalMaterial color={jelly.color} transmission={.32} thickness={.7} ior={1.4} roughness={.16} clearcoat={1} clearcoatRoughness={.1}/>
  </RoundedBox>;
}

function Playground({ jellies, onRemove }: { jellies: Jelly[]; onRemove: (id: number) => void }) {
  const world = useRef(new Map<number, Body>());
  const [removedInitial, setRemovedInitial] = useState<number[]>([]);
  function remove(id: number) {
    if (id < 0) setRemovedInitial((current) => [...current, id]);
    onRemove(id);
  }
  useFrame((_, rawDelta) => {
    stepJellies([...world.current.values()], rawDelta);
  });
  return <group position={[0, -.35, 0]}>
    <mesh position={[0, -.61, 0]}><cylinderGeometry args={[2.18, 2.07, .32, 80]}/><meshPhysicalMaterial color="#9bb596" roughness={.48} clearcoat={.45}/></mesh>
    <mesh position={[0, -.455, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.06,.045,12,80]}/><meshStandardMaterial color="#d0d9b6" roughness={.55}/></mesh>
    <ContactShadows position={[0, -.442, 0]} opacity={.3} scale={5} blur={2.2} far={3} resolution={128}/>
    {[...initial.filter((jelly) => !removedInitial.includes(jelly.id)), ...jellies].map((jelly, i) => <BouncingJelly key={jelly.id} jelly={jelly} index={i} world={world} onRemove={remove}/>)}
  </group>;
}

export default function PlaygroundScene({ jellies, onRemove }: { jellies: Jelly[]; onRemove: (id: number) => void }) {
  const { container, visible } = useSceneVisibility();
  return <div ref={container} style={{width:"100%",height:"100%"}}>
    <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.4]} camera={{ position: [2.7, 3.2, 6.3], fov: 38 }} gl={{ alpha: true, antialias: true }}>
      <StudioLights/><Playground jellies={jellies} onRemove={onRemove}/>
    </Canvas>
  </div>;
}
