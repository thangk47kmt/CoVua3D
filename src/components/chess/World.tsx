import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Object3D,
  SRGBColorSpace,
  type Group,
  type InstancedMesh,
  type Mesh,
  type PointLight,
  type Points,
} from "three";
import type { BoardTheme } from "./themes";

function stage(inner: string, mid: string, outer: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(256, 256, 24, 256, 256, 256);
    g.addColorStop(0, inner);
    g.addColorStop(0.42, mid);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function bands(colors: string[]): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, (i * 128) / colors.length, 128, 128 / colors.length + 1);
    });
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function puff(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function Stars({ count, color, radius }: { count: number; color: string; radius: number }) {
  const geom = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = radius * (0.45 + Math.random() * 0.7);
      const theta = Math.random() * Math.PI * 2;
      array[i * 3] = Math.cos(theta) * r;
      array[i * 3 + 1] = (Math.random() - 0.4) * radius * 0.7;
      array[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(array, 3));
    return geometry;
  }, [count, radius]);
  return (
    <points geometry={geom} raycast={() => null}>
      <pointsMaterial color={color} size={0.06} transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

function GalaxyWorld({ theme }: { theme: BoardTheme }) {
  const rocks = useRef<InstancedMesh>(null);
  const planets = useRef<Group>(null);
  const boom = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const belt = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        ang: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.035,
        radius: 12.5 + Math.random() * 6,
        y: 1.2 + Math.random() * 3.4,
        size: 0.18 + Math.random() * 0.28,
        tilt: Math.random() * Math.PI,
      })),
    [],
  );
  const planetPos = useMemo(
    () =>
      [
        [-16, 4.4, -14, 1.55],
        [16, 4.4, -14, 1.55],
        [0, 7.2, -22, 2.05],
        [-9, 2.2, -20, 0.72],
        [9, 2.2, -20, 0.72],
      ] as const,
    [],
  );
  const hit = useRef({ until: 0, next: 5, x: 0, y: 2, z: -14 });
  const sky = useMemo(() => stage("#050814", "#16306e", "#070b18"), []);
  const skins = useMemo(
    () => [
      bands(["#6a4a28", "#c4a06a", "#8a6234", "#e6d2a4", "#6a4a28"]),
      bands(["#2a4a7a", "#8eb4e0", "#d8ecff", "#3a6aaa"]),
      bands(["#6a3048", "#d08a7a", "#f0d0b0", "#8a4060"]),
      bands(["#3a4a32", "#8aaa72", "#d8e0b0", "#4a5a38"]),
      bands(["#243044", "#7f8ea8", "#d5deea", "#31445c"]),
    ],
    [],
  );

  useFrame((_, delta) => {
    const t = performance.now() / 1000;
    planets.current?.children.forEach((child, i) => {
      child.rotation.y += delta * (0.05 + i * 0.015);
    });
    const event = hit.current;
    if (t > event.next) {
      if (Math.random() < 0.55) {
        const p = planetPos[Math.floor(Math.random() * planetPos.length)]!;
        event.x = p[0];
        event.y = p[1];
        event.z = p[2];
      } else {
        const a = belt[Math.floor(Math.random() * belt.length)]!;
        const b = belt[Math.floor(Math.random() * belt.length)]!;
        event.x = Math.cos(a.ang) * a.radius * 0.5 + Math.cos(b.ang) * b.radius * 0.5;
        event.y = (a.y + b.y) * 0.5;
        event.z = Math.sin(a.ang) * a.radius * 0.5 + Math.sin(b.ang) * b.radius * 0.5;
      }
      const rock = belt[Math.floor(Math.random() * belt.length)]!;
      rock.ang = Math.atan2(event.z, event.x);
      event.until = t + 0.65;
      event.next = t + 6.5 + Math.random() * 8;
    }
    const mesh = rocks.current;
    if (mesh) {
      belt.forEach((rock, i) => {
        rock.ang += rock.speed * delta * 8;
        dummy.position.set(
          Math.cos(rock.ang) * rock.radius,
          rock.y + Math.sin(t * 0.4 + i) * 0.12,
          Math.sin(rock.ang) * rock.radius,
        );
        dummy.rotation.set(rock.tilt, rock.ang * 3, rock.tilt * 0.4);
        dummy.scale.setScalar(rock.size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    const flash = boom.current;
    if (flash) {
      const life = event.until - t;
      flash.visible = life > 0;
      if (life > 0) {
        const k = 1 - life / 0.65;
        flash.position.set(event.x, event.y, event.z);
        flash.scale.setScalar(0.25 + k * 2.2);
        const mat = flash.material as { opacity: number };
        mat.opacity = (1 - k) * 0.9;
        const light = flash.children[0] as PointLight | undefined;
        if (light) light.intensity = (1 - k) * 30;
      }
    }
  });

  return (
    <group>
      <Stars count={160} color="#d5e4ff" radius={34} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} raycast={() => null}>
        <circleGeometry args={[30, 40]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      <group ref={planets}>
        {planetPos.map((p, i) => (
          <mesh key={i} position={[p[0], p[1], p[2]]} raycast={() => null}>
            <sphereGeometry args={[p[3], 12, 10]} />
            <meshStandardMaterial map={skins[i]} roughness={0.72} metalness={0.08} emissive={theme.lightB} emissiveIntensity={0.08} />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={rocks} args={[undefined, undefined, belt.length]} raycast={() => null} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9a8b74" roughness={0.86} metalness={0.12} />
      </instancedMesh>
      <mesh ref={boom} visible={false} raycast={() => null}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial color={theme.burst} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        <pointLight color={theme.burst} intensity={0} distance={10} />
      </mesh>
    </group>
  );
}

function Arena() {
  const cols = useRef<InstancedMesh>(null);
  const n = 28;
  useLayoutEffect(() => {
    const mesh = cols.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 6.5, 0.62, Math.sin(a) * 6.5);
      dummy.rotation.set(0, -a, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} raycast={() => null}>
        <ringGeometry args={[5.85, 7.35, 48]} />
        <meshStandardMaterial color="#cbb89a" roughness={0.8} />
      </mesh>
      <instancedMesh ref={cols} args={[undefined, undefined, n]} raycast={() => null} frustumCulled={false}>
        <boxGeometry args={[0.38, 1.45, 0.55]} />
        <meshStandardMaterial color="#f4ecdc" roughness={0.78} />
      </instancedMesh>
    </group>
  );
}

function RomeWorld() {
  const ground = useMemo(() => stage("#3a2a1c", "#8a6844", "#2a1c12"), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} raycast={() => null}>
        <circleGeometry args={[34, 64]} />
        <meshStandardMaterial map={ground} roughness={0.95} />
      </mesh>
      <Arena />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.28, 0]} raycast={() => null}>
        <torusGeometry args={[6.5, 0.11, 8, 56]} />
        <meshStandardMaterial color="#f6efe2" metalness={0.15} roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 14, -0.15, -11]} rotation={[0, side * 0.4, 0]} raycast={() => null}>
          <sphereGeometry args={[3.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6a5438" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function SanguoWorld({ theme }: { theme: BoardTheme }) {
  const ground = useMemo(() => stage("#1a140e", "#4a3020", "#120c0a"), []);
  const smoke = useMemo(() => puff(), []);
  const fires = useRef<Points>(null);
  const clouds = useRef<Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const r = 8 + (i % 4) * 3.2;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.6 + (i % 3) * 0.7, p: i / 12 };
      }),
    [],
  );
  const fireGeom = useMemo(() => {
    const count = 16;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 7.2 + Math.random() * 16;
      array[i * 3] = Math.cos(a) * r;
      array[i * 3 + 1] = 0.25 + Math.random() * 0.8;
      array[i * 3 + 2] = Math.sin(a) * r;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(array, 3));
    return geometry;
  }, []);
  useFrame(() => {
    const t = performance.now() / 1000;
    const mat = fires.current?.material as { size?: number } | undefined;
    if (mat) mat.size = 0.22 + Math.sin(t * 7) * 0.06;
    clouds.current?.children.forEach((child, i) => {
      const seed = seeds[i];
      if (!seed) return;
      const u = (seed.p + t * 0.035) % 1;
      child.position.set(seed.x + Math.sin(t * 0.2 + i) * 0.3, 0.6 + u * 4.2, seed.z);
      const cloud = child.children[0] as Mesh | undefined;
      const material = cloud?.material as { opacity: number } | undefined;
      if (material) material.opacity = Math.sin(u * Math.PI) * 0.42;
    });
  });
  const flags = [
    [6.3, 0, "#1d6b3a"],
    [-6.3, 0, "#1a1a1a"],
    [0, 6.3, "#a32020"],
    [0, -6.3, "#d4a84a"],
  ] as const;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} raycast={() => null}>
        <circleGeometry args={[34, 40]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>
      <points ref={fires} geometry={fireGeom} raycast={() => null}>
        <pointsMaterial color={theme.lightA} size={0.24} transparent opacity={0.9} sizeAttenuation blending={AdditiveBlending} depthWrite={false} />
      </points>
      <group ref={clouds}>
        {seeds.map((seed) => (
          <Billboard key={`${seed.x}${seed.z}`} position={[seed.x, 1, seed.z]}>
            <mesh raycast={() => null}>
              <planeGeometry args={[seed.s * 2.4, seed.s * 1.5]} />
              <meshBasicMaterial map={smoke} color="#2a2420" transparent opacity={0.25} depthWrite={false} />
            </mesh>
          </Billboard>
        ))}
      </group>
      {flags.map(([x, z, color]) => (
        <group key={color} position={[x, 0, z]}>
          <mesh position={[0, 1.15, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.035, 0.045, 2.3, 6]} />
            <meshStandardMaterial color="#3a2a18" />
          </mesh>
          <mesh position={[0.42, 1.85, 0]} raycast={() => null}>
            <planeGeometry args={[0.85, 0.48]} />
            <meshStandardMaterial color={color} side={DoubleSide} emissive={color} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SimpleWorld({ theme }: { theme: BoardTheme }) {
  const ground = useMemo(() => {
    if (theme.world === "volcano") return stage("#1a0c0a", "#6a2414", "#100806");
    if (theme.world === "sea") return stage("#063040", "#0e6e86", "#042028");
    if (theme.world === "shrine") return stage("#101820", "#243044", "#0c1016");
    return stage(theme.sky, theme.fog, "#07060c");
  }, [theme]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} raycast={() => null}>
        <circleGeometry args={[30, 36]} />
        <meshBasicMaterial map={ground} />
      </mesh>
      {theme.world === "volcano" && (
        <mesh position={[0, 1.2, -16]} raycast={() => null}>
          <coneGeometry args={[4.2, 6, 8]} />
          <meshStandardMaterial color="#3a1812" emissive="#ff5a20" emissiveIntensity={0.15} />
        </mesh>
      )}
      {theme.world === "sea" && (
        <mesh position={[0, 5.5, -16]} raycast={() => null}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshStandardMaterial color="#f4f0e4" emissive="#fff6dc" emissiveIntensity={0.4} />
        </mesh>
      )}
      {theme.world === "shrine" && (
        <group position={[0, 0, -12]}>
          <mesh position={[-1.1, 1.1, 0]}>
            <boxGeometry args={[0.18, 2.2, 0.18]} />
            <meshStandardMaterial color="#a32030" />
          </mesh>
          <mesh position={[1.1, 1.1, 0]}>
            <boxGeometry args={[0.18, 2.2, 0.18]} />
            <meshStandardMaterial color="#a32030" />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <boxGeometry args={[2.8, 0.16, 0.28]} />
            <meshStandardMaterial color="#a32030" />
          </mesh>
        </group>
      )}
      {(theme.world === "aurora" || theme.world === "shrine") && <Stars count={80} color="#e7f0ff" radius={28} />}
    </group>
  );
}

export function World({ theme }: { theme: BoardTheme }) {
  if (theme.world === "galaxy") return <GalaxyWorld theme={theme} />;
  if (theme.world === "rome") return <RomeWorld />;
  if (theme.world === "sanguo") return <SanguoWorld theme={theme} />;
  return <SimpleWorld theme={theme} />;
}
