"use client";

import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useSceneVisibility } from "./useSceneVisibility";

export type Flavor = "latte" | "toast" | "brew";
type Props = { flavor: Flavor; wobbleCount: number; onWobble?: () => void; onReady?: () => void };
const pieces = [
  {p:[-.57,.64,.34],r:[.2,.4,.3],c:"#82b621",s:.62},
  {p:[.46,.5,-.1],r:[.4,.2,-.3],c:"#f7b82c",s:.64},
  {p:[-.13,.16,.82],r:[.2,.5,.25],c:"#ee6e55",s:.64},
  {p:[.5,-.31,.49],r:[.3,.1,-.25],c:"#e6a21c",s:.62},
  {p:[-.4,-.46,.39],r:[.15,.2,.55],c:"#699d24",s:.65},
  {p:[.12,-.86,.33],r:[.3,.1,.3],c:"#ffe052",s:.7},
  {p:[-.6,-.12,-.3],r:[.2,.2,-.3],c:"#f4ab59",s:.5},
  {p:[.38,.72,.43],r:[.3,.3,.1],c:"#ffd76b",s:.5},
] as const;

function JellyPiece({ piece, index, brew }: { piece: typeof pieces[number]; index: number; brew: boolean }) {
  const time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => {
    const g = new RoundedBoxGeometry(piece.s * 1.12, piece.s, piece.s * .94, 5, .085);
    const points = g.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      points.setXYZ(i, x + Math.sin(y * 12 + z * 7 + index) * .025, y + Math.sin(x * 11 + z * 9 + index) * .023, z + Math.cos(x * 9 + y * 8) * .025);
    }
    g.computeVertexNormals();
    return g;
  }, [piece, index]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => { time.value = clock.elapsedTime; });
  return <mesh geometry={geometry} position={[...piece.p]} rotation={[...piece.r]}>
    <meshPhysicalMaterial color={brew ? (index % 2 ? "#ae7950" : "#ecd3a0") : piece.c} roughness={.21} transmission={.65} thickness={.65} ior={1.42} clearcoat={.9} clearcoatRoughness={.14} envMapIntensity={1.1}
      onBeforeCompile={(shader) => {
        shader.uniforms.jellyTime = time;
        shader.vertexShader = "uniform float jellyTime; varying vec3 jellyPoint;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\njellyPoint=position; transformed += normal * sin(position.y*9.0+position.x*5.0+jellyTime*2.0) * .008;");
        shader.fragmentShader = "varying vec3 jellyPoint;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\nfloat fleck=sin(jellyPoint.x*140.0+sin(jellyPoint.z*95.0))*sin(jellyPoint.y*130.0); diffuseColor.rgb *= .96+fleck*.045;");
      }}/>
  </mesh>;
}

function GlassGlints() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry(), positions: number[] = [], colors: number[] = [], indices: number[] = [];
    for (let strip = 0; strip < 5; strip++) {
      const angle = -1.25 + strip * .61;
      for (let row = 0; row <= 20; row++) {
        const t = row / 20, radius = .86 + t * .38;
        for (let edge = 0; edge < 2; edge++) {
          const a = angle + (edge - .5) * (.075 + Math.sin(t * 8 + strip) * .045);
          positions.push(Math.sin(a) * radius, -1.2 + t * 2.2, Math.cos(a) * radius);
          const c = new THREE.Color().setHSL((.53 + t * .5 + strip * .17) % 1, .7, .77);
          colors.push(c.r, c.g, c.b);
        }
        if (row < 20) { const n = strip * 42 + row * 2; indices.push(n,n+1,n+2,n+1,n+3,n+2); }
      }
    }
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} renderOrder={3}><meshBasicMaterial vertexColors transparent opacity={.29} depthWrite={false} side={THREE.DoubleSide}/></mesh>;
}

export function StudioLights() {
  return <>
    <ambientLight intensity={.65}/>
    <directionalLight position={[-3,6,5]} intensity={2.1} color="#fff1cb"/>
    <directionalLight position={[4,2,-2]} intensity={1.3} color="#c6eaf0"/>
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={3.5} color="#fff3d5" scale={[6,8,1]} position={[-4,3,4]} target={[0,0,0]}/>
      <Lightformer form="rect" intensity={2.5} color="#bcdde5" scale={[2,7,1]} position={[4,1,2]} target={[0,0,0]}/>
      <Lightformer form="rect" intensity={1.5} color="#f3b7cf" scale={[1,6,1]} position={[-3,-1,1]} target={[0,0,0]}/>
      <Lightformer form="circle" intensity={3} color="#fff7dc" scale={5} position={[0,5,-2]} target={[0,0,0]}/>
    </Environment>
  </>;
}

function Cream({ brew=false }: {brew?:boolean}) {
  const crumbs = useMemo(() => Array.from({length:50},(_,i)=>{
    const a=i*2.39996, r=.43*Math.sqrt((i+.5)/50);
    return {x:Math.cos(a)*r+.32,z:Math.sin(a)*r-.12,y:1.24+(.5-r)*.27,s:.012+(i%4)*.005};
  }),[]);
  return <group>
    {[[-.04,1.1,-.16,.48,.14,.43],[.38,1.13,-.12,.48,.2,.44],[.63,1.08,.03,.3,.15,.3],[.23,1.23,-.19,.32,.15,.28],[.43,1.29,-.17,.2,.13,.2]].map((v,i)=><mesh key={i} position={v.slice(0,3) as [number,number,number]} scale={v.slice(3) as [number,number,number]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={i%2?"#fff1d2":"#ffe6b3"} roughness={.75}/></mesh>)}
    {brew && <group position={[0,.13,0]}>{[0,1,2,3,4].map((i)=><mesh key={i} position={[Math.sin(i*1.8)*.08,1.12+i*.115,-.1]} rotation={[Math.PI/2+.05,0,.04]}><torusGeometry args={[.41-i*.07,.105-i*.012,10,32]}/><meshStandardMaterial color="#fff0ce" roughness={.6}/></mesh>)}</group>}
    {crumbs.map((p,i)=><mesh key={i} position={[p.x,p.y,p.z]} rotation={[i,0,i*.7]}><sphereGeometry args={[p.s,4,3]}/><meshStandardMaterial color={i%3?"#b77732":"#845024"} roughness={1}/></mesh>)}
  </group>;
}

export function Drink({flavor="latte", animate=false, wobbleCount=0, onWobble=()=>{}}: Partial<Props> & {animate?:boolean}) {
  const group=useRef<THREE.Group>(null), fruit=useRef<THREE.Group>(null);
  const liquid=useRef<THREE.MeshPhysicalMaterial>(null);
  const drag=useRef({active:false,x:0,y:0,target:0,angle:0,velocity:0,kick:0,count:wobbleCount});
  const reduced=useRef(false);
  useEffect(()=>{reduced.current=window.matchMedia("(prefers-reduced-motion: reduce)").matches;},[]);
  const profile=useMemo(()=>[[0,-1.3],[.77,-1.3],[.86,-1.26],[.91,-1.1],[1.19,.82],[1.27,1.01],[1.29,1.09],[1.25,1.13],[1.21,1.04],[1.14,.8],[.85,-1.1],[.78,-1.19],[0,-1.19]].map(([x,y])=>new THREE.Vector2(x,y)),[]);
  const color=useMemo(()=>new THREE.Color(flavor==="brew"?"#603319":"#794325"),[flavor]);
  useFrame(({clock,pointer},rawDelta)=>{
    if(!group.current)return;
    const d=Math.min(rawDelta,.04),m=drag.current,t=clock.elapsedTime;
    if(m.count!==wobbleCount){m.count=wobbleCount;m.kick=.6;m.velocity=1.8;}
    if(!m.active)m.target=animate ? pointer.x * -.2 : 0;
    m.velocity+=((m.target-m.angle)*80-m.velocity*8)*d;m.angle+=m.velocity*d;m.kick*=Math.exp(-d*3);
    if(animate){
      const idle=reduced.current ? 0 : 1;
      group.current.rotation.z=m.angle+Math.sin(t*1.25)*.012*idle;
      group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,pointer.x*.3+Math.sin(t*.6)*.035*idle,5,d);
      group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,pointer.y*.13,5,d);
      group.current.position.x=THREE.MathUtils.damp(group.current.position.x,pointer.x*.13,5,d);
      group.current.position.y=Math.sin(t*1.4)*.025*idle;
      group.current.scale.set(1+m.kick*.06,1-m.kick*.1,1+m.kick*.06);
      if(fruit.current){fruit.current.rotation.z=-m.angle*.3;fruit.current.position.y=Math.sin(t*2)*.025*idle+m.kick*.06;}
    }
    liquid.current?.color.lerp(color,1-Math.exp(-d*4));
  });
  function down(e:ThreeEvent<PointerEvent>){if(!animate)return;e.stopPropagation();drag.current.active=true;drag.current.x=e.clientX;drag.current.y=e.clientY;(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);}
  function move(e:ThreeEvent<PointerEvent>){const m=drag.current;if(!m.active)return;m.target=THREE.MathUtils.clamp((e.clientX-m.x)*-.004,-.4,.4);m.kick=Math.min(.6,Math.abs(e.clientY-m.y)*.005);}
  function up(e:ThreeEvent<PointerEvent>){if(!drag.current.active)return;drag.current.active=false;drag.current.kick=.6;(e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(e.pointerId);onWobble();}
  return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <mesh position={[0,-.14,0]}><cylinderGeometry args={[1.15,.8,2.1,64]}/><meshPhysicalMaterial ref={liquid} color={color} transparent opacity={flavor==="brew"?.72:.68} roughness={.32} transmission={.08} thickness={.5} depthWrite={false}/></mesh>
    <group ref={fruit}>{pieces.map((p,i)=><JellyPiece key={i} piece={p} index={i} brew={flavor==="brew"}/>)}</group>
    <mesh position={[0,.94,0]}><cylinderGeometry args={[1.16,1.16,.045,64]}/><meshPhysicalMaterial color={flavor==="brew"?"#8f562e":"#aa7043"} transparent opacity={.82} roughness={.28} metalness={.05}/></mesh>
    <Cream brew={flavor==="brew"}/>
    {flavor!=="brew" && <RoundedBox args={[.47,.32,.43]} radius={.06} smoothness={4} position={[-.47,1.11,.13]} rotation={[.12,.4,.12]}><meshPhysicalMaterial color="#7cae1d" transmission={.3} thickness={.4} roughness={.16} clearcoat={1}/></RoundedBox>}
    <mesh><latheGeometry args={[profile,96]}/><meshPhysicalMaterial color="#fff5dc" transparent opacity={.24} depthWrite={false} transmission={.7} thickness={.12} ior={1.36} roughness={.12} envMapIntensity={.7} clearcoat={1} iridescence={.65} iridescenceIOR={1.3} iridescenceThicknessRange={[180,430]} side={THREE.FrontSide}/></mesh>
    <mesh position={[0,1.09,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.27,.046,16,96]}/><meshPhysicalMaterial color="#dad5ee" metalness={.23} transmission={.45} thickness={.25} ior={1.4} roughness={.08} iridescence={1} iridescenceThicknessRange={[150,500]} clearcoat={1} envMapIntensity={1.1}/></mesh>
    <mesh position={[0,-1.25,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.81,.035,12,64]}/><meshPhysicalMaterial color="#e0e5ba" transmission={.6} thickness={.14} roughness={.12} iridescence={.7}/></mesh>
    <GlassGlints/>
    {[-1.02,-.83,.89,1.04].map((x,i)=><mesh key={i} position={[x,-.05,.53]} rotation={[0,0,-x*.13]}><capsuleGeometry args={[.012+(i%2)*.008,1.65,4,8]}/><meshBasicMaterial color={i%2?"#ffe1cb":"#eff7ed"} transparent opacity={.32}/></mesh>)}
  </group>;
}

export function Toast({animate=false,hero=false,wobbleCount=0,onWobble=()=>{}}:{animate?:boolean;hero?:boolean;wobbleCount?:number;onWobble?:()=>void}){
  const group=useRef<THREE.Group>(null);
  const gesture=useRef({dragging:false,startX:0,target:0,kick:0,count:wobbleCount,scale:.85});
  useFrame(({pointer,clock},rawDelta)=>{if(group.current&&animate){
    const d=Math.min(rawDelta,.04),g=gesture.current;
    if(g.count!==wobbleCount){g.count=wobbleCount;g.kick=.5;}
    if(!g.dragging)g.target=THREE.MathUtils.damp(g.target,0,5,d);
    g.kick*=Math.exp(-d*4);g.scale=THREE.MathUtils.damp(g.scale,hero?1.45:1,7,d);
    group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,-.22+pointer.x*.35+g.target,7,d);
    group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,.22+pointer.y*.15,7,d);
    group.current.rotation.z=THREE.MathUtils.damp(group.current.rotation.z,pointer.x*-.1+Math.sin(clock.elapsedTime*15)*g.kick*.18,7,d);
    group.current.position.y=Math.sin(clock.elapsedTime*2)*.045;
    group.current.scale.setScalar(g.scale);
  }});
  function down(e:ThreeEvent<PointerEvent>){e.stopPropagation();gesture.current.dragging=true;gesture.current.startX=e.clientX;(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);}
  function move(e:ThreeEvent<PointerEvent>){if(gesture.current.dragging)gesture.current.target=THREE.MathUtils.clamp((e.clientX-gesture.current.startX)*.008,-.8,.8);}
  function up(e:ThreeEvent<PointerEvent>){if(!gesture.current.dragging)return;gesture.current.dragging=false;gesture.current.kick=.7;(e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(e.pointerId);onWobble();}
  return <group ref={group} rotation={[.15,-.22,0]} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <RoundedBox args={[2.1,.37,1.75]} radius={.18} smoothness={4} position={[0,-.25,0]}><meshStandardMaterial color="#a85622" roughness={.85}/></RoundedBox>
    <RoundedBox args={[2.04,.28,1.69]} radius={.17} smoothness={4} position={[0,-.03,0]}><meshStandardMaterial color="#eab35b" roughness={.85}/></RoundedBox>
    <RoundedBox args={[1.82,.08,1.47]} radius={.08} smoothness={3} position={[0,.14,0]}><meshStandardMaterial color="#f6d486" roughness={.8}/></RoundedBox>
    {Array.from({length:12},(_,i)=><RoundedBox key={i} args={[.43,.28+(i%3)*.04,.42]} radius={.09} smoothness={3} position={[(i%4-1.5)*.45,.31, (Math.floor(i/4)-1)*.46]} rotation={[0,i*.35,0]}><meshPhysicalMaterial color={["#e8a226","#e57655","#9dad34","#ed8d87","#b586b4"][i%5]} transmission={.27} thickness={.3} roughness={.12} clearcoat={1}/></RoundedBox>)}
  </group>;
}

function SceneReady({ onReady }: { onReady?: () => void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (!reported.current) { reported.current = true; onReady?.(); }
  });
  return null;
}

export default function WobbleScene(props:Props){
  const { container, visible } = useSceneVisibility();
  return <div ref={container} style={{width:"100%",height:"100%"}}><Canvas frameloop={visible ? "always" : "never"} dpr={[1,1.5]} camera={{position:[0,3.1,7],fov:32}} gl={{alpha:true,antialias:true}}><StudioLights/>{props.flavor==="toast"?<Toast animate hero wobbleCount={props.wobbleCount} onWobble={props.onWobble}/>:<Drink {...props} animate/>}<SceneReady onReady={props.onReady}/></Canvas></div>;
}
