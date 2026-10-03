import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
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
import { effectsPaused } from "@/game/view";

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

function nebulaSky(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(0.5, 0.5);
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, "#050714");
    sky.addColorStop(0.42, "#120c2e");
    sky.addColorStop(0.55, "#1a1240");
    sky.addColorStop(1, "#070914");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 2048, 1024);
    const washes: [number, number, number, number, string][] = [
      [1040, 470, 780, 220, "rgba(92, 48, 180, 0.28)"],
      [620, 520, 640, 180, "rgba(36, 78, 190, 0.22)"],
      [1500, 500, 560, 160, "rgba(210, 150, 70, 0.16)"],
      [980, 430, 420, 90, "rgba(230, 210, 255, 0.12)"],
    ];
    for (const [x, y, rx, ry, color] of washes) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, ry * 0.15, 0, 0, ry);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 0.55;
    const band = ctx.createLinearGradient(0, 430, 0, 620);
    band.addColorStop(0, "rgba(0,0,0,0)");
    band.addColorStop(0.45, "rgba(210, 180, 255, 0.16)");
    band.addColorStop(0.5, "rgba(255, 236, 200, 0.22)");
    band.addColorStop(0.55, "rgba(120, 160, 255, 0.14)");
    band.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 400, 2048, 250);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 1600; i += 1) {
      const gold = i % 11 === 0;
      ctx.fillStyle = gold ? "#ffe7b8" : "#f4f7ff";
      ctx.globalAlpha = gold ? 0.55 + Math.random() * 0.45 : 0.2 + Math.random() * 0.75;
      const s = i % 23 === 0 ? 2.2 : i % 7 === 0 ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.arc(Math.random() * 2048, Math.random() * 1024, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function battleSky(top: string, glow: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(0.72, top);
    g.addColorStop(1, glow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 256);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function battleGround(earth: string, scorch: string, fire: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = earth;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 28; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? scorch : "rgba(0,0,0,0.35)";
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(40 + Math.random() * 430, 40 + Math.random() * 430, 10 + Math.random() * 36, 6 + Math.random() * 16, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const pr = 108 + (i % 3) * 36;
      const x = 256 + Math.cos(a) * pr;
      const y = 256 + Math.sin(a) * pr;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 46);
      g.addColorStop(0, "#fff4c8");
      g.addColorStop(0.22, fire);
      g.addColorStop(0.55, "rgba(120,28,8,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 52, y - 52, 104, 104);
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function RisingSmoke({
  color,
  map,
  seeds,
}: {
  color: string;
  map: CanvasTexture;
  seeds: { x: number; z: number; s: number; p: number; speed: number }[];
}) {
  const groups = useRef<(Group | null)[]>([]);
  useFrame(() => {
    if (effectsPaused()) return;
    const t = performance.now() / 1000;
    seeds.forEach((seed, i) => {
      const node = groups.current[i];
      if (!node) return;
      const u = (seed.p + t * seed.speed) % 1;
      node.position.set(seed.x + Math.sin(t * 0.15 + i) * 0.25, -2.7 + u * 3.4, seed.z);
      node.scale.setScalar(0.75 + u * 0.7);
      const cloud = node.children[0]?.children[0] as Mesh | undefined;
      const material = cloud?.material as { opacity: number } | undefined;
      if (material) material.opacity = Math.sin(u * Math.PI) * 0.42;
    });
  });
  return (
    <group>
      {seeds.map((seed, i) => (
        <group key={`${seed.x}-${seed.z}`} ref={(node) => { groups.current[i] = node; }}>
          <Billboard>
            <mesh raycast={() => null}>
              <planeGeometry args={[seed.s * 1.8, seed.s * 2.4]} />
              <meshBasicMaterial map={map} color={color} transparent opacity={0.35} depthWrite={false} />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  );
}

function WarBelow({
  earth,
  scorch,
  fire,
  smoke,
  skyTop,
  skyGlow,
}: {
  earth: string;
  scorch: string;
  fire: string;
  smoke: string;
  skyTop: string;
  skyGlow: string;
}) {
  const ground = useMemo(() => battleGround(earth, scorch, fire), [earth, scorch, fire]);
  const sky = useMemo(() => battleSky(skyTop, skyGlow), [skyTop, skyGlow]);
  const smokeMap = useMemo(() => puff(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const r = 11 + (i % 3) * 3.2;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.5 + (i % 3) * 0.35, p: (i * 0.17) % 1, speed: 0.045 + (i % 3) * 0.01 };
      }),
    [],
  );
  const embers = useMemo(() => {
    const count = 70;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 16;
      array[i * 3] = Math.cos(a) * r;
      array[i * 3 + 1] = -2.5 + Math.random() * 1.2;
      array[i * 3 + 2] = Math.sin(a) * r;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(array, 3));
    return geometry;
  }, []);
  const flicker = useRef<Points>(null);
  useFrame(() => {
    if (effectsPaused()) return;
    const mat = flicker.current?.material as { size?: number; opacity?: number } | undefined;
    if (!mat) return;
    const t = performance.now() / 1000;
    mat.size = 0.16 + Math.sin(t * 8) * 0.03;
    mat.opacity = 0.65 + Math.sin(t * 5) * 0.2;
  });
  return (
    <group>
      <mesh raycast={() => null}>
        <sphereGeometry args={[78, 28, 18]} />
        <meshBasicMaterial map={sky} side={BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.15, 0]} raycast={() => null}>
        <circleGeometry args={[40, 48]} />
        <meshBasicMaterial map={ground} />
      </mesh>
      {seeds
        .filter((_, i) => i % 2 === 0)
        .map((seed) => (
          <Billboard key={`flame-${seed.x}`} position={[seed.x, -2.35, seed.z]}>
            <mesh raycast={() => null}>
              <planeGeometry args={[2.4, 2.4]} />
              <meshBasicMaterial map={smokeMap} color={fire} transparent opacity={0.95} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          </Billboard>
        ))}
      <points ref={flicker} geometry={embers} raycast={() => null}>
        <pointsMaterial color={fire} size={0.16} transparent opacity={0.85} sizeAttenuation blending={AdditiveBlending} depthWrite={false} />
      </points>
      <RisingSmoke color={smoke} map={smokeMap} seeds={seeds} />
    </group>
  );
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
        [-22, 10, -30, 1.7],
        [24, 8, -28, 1.45],
        [2, 16, -36, 2.2],
        [-14, 7, -32, 0.85],
        [15, 6, -31, 0.8],
      ] as const,
    [],
  );
  const hit = useRef({ until: 0, next: 5, x: 0, y: 2, z: -14 });
  const sky = useMemo(() => nebulaSky(), []);
  const glow = useMemo(() => puff(), []);
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
    if (effectsPaused()) return;
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
      <Stars count={180} color="#e7f1ff" radius={58} />
      <Stars count={28} color="#ffe3a4" radius={46} />
      <mesh raycast={() => null}>
        <sphereGeometry args={[90, 32, 20]} />
        <meshBasicMaterial map={sky} side={BackSide} />
      </mesh>
      <group ref={planets}>
        {planetPos.map((p, i) => (
          <group key={i} position={[p[0], p[1], p[2]]}>
            <mesh raycast={() => null}>
              <sphereGeometry args={[p[3], 16, 12]} />
              <meshStandardMaterial map={skins[i]} roughness={0.55} metalness={0.12} emissive={i === 2 ? "#e4c27a" : "#6a88c8"} emissiveIntensity={0.12} />
            </mesh>
            <Billboard>
              <mesh raycast={() => null}>
                <planeGeometry args={[p[3] * 3.1, p[3] * 3.1]} />
                <meshBasicMaterial map={glow} transparent opacity={0.28} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
              </mesh>
            </Billboard>
            {i === 2 && (
              <mesh rotation={[1.15, 0.2, 0.4]} raycast={() => null}>
                <torusGeometry args={[p[3] * 1.85, 0.08, 8, 48]} />
                <meshStandardMaterial color="#e7d2a4" emissive="#c4a06a" emissiveIntensity={0.35} metalness={0.6} roughness={0.35} />
              </mesh>
            )}
          </group>
        ))}
      </group>
      <instancedMesh ref={rocks} args={[undefined, undefined, belt.length]} raycast={() => null} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#d7e4ff" roughness={0.35} metalness={0.2} emissive="#7c40d2" emissiveIntensity={0.35} />
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
  return (
    <group>
      <WarBelow earth="#3a2c22" scorch="#6a4a34" fire="#ff7a32" smoke="#f4ece2" skyTop="#16100c" skyGlow="#3a2818" />
      <Arena />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.28, 0]} raycast={() => null}>
        <torusGeometry args={[6.5, 0.11, 8, 56]} />
        <meshStandardMaterial color="#f6efe2" metalness={0.15} roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 16, -3.15, -18]} rotation={[0, side * 0.4, 0]} raycast={() => null}>
          <sphereGeometry args={[3.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6a5438" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function SanguoWorld({ theme }: { theme: BoardTheme }) {
  const flags = [
    [6.3, 0, "#1d6b3a"],
    [-6.3, 0, "#1a1a1a"],
    [0, 6.3, "#a32020"],
    [0, -6.3, "#d4a84a"],
  ] as const;
  return (
    <group>
      <WarBelow earth="#2c1814" scorch="#5a3024" fire={theme.lightA} smoke="#f4ece2" skyTop="#120a08" skyGlow="#5a2818" />
      {flags.map(([x, z, color]) => (
        <group key={color} position={[x, -0.2, z]}>
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
  const palette =
    theme.world === "volcano"
      ? { earth: "#1a0c0a", scorch: "#4a1810", fire: "#ff5a24", smoke: "#c8a090", skyTop: "#1a0a08", skyGlow: "#a84820" }
      : theme.world === "sea"
        ? { earth: "#062028", scorch: "#0c3040", fire: "#e07030", smoke: "#b7e4e0", skyTop: "#042028", skyGlow: "#1a6878" }
        : theme.world === "shrine"
          ? { earth: "#12141c", scorch: "#2a2030", fire: "#e06040", smoke: "#d0c8e0", skyTop: "#10131c", skyGlow: "#6a5088" }
          : theme.world === "nile"
            ? { earth: "#3a2a16", scorch: "#6a4a28", fire: "#e07830", smoke: "#f3e6d0", skyTop: "#1a120c", skyGlow: "#6a4820" }
            : theme.world === "frost"
              ? { earth: "#1a2834", scorch: "#2c4054", fire: "#e07040", smoke: "#e7f3ff", skyTop: "#101820", skyGlow: "#3a5870" }
              : theme.world === "neon"
                ? { earth: "#140818", scorch: "#301028", fire: "#ff40a0", smoke: "#d8f4ff", skyTop: "#0a0612", skyGlow: "#401850" }
                : theme.world === "viet"
                  ? { earth: "#3a2214", scorch: "#6a3818", fire: "#e07030", smoke: "#f3e6d0", skyTop: "#1a100c", skyGlow: "#6a3818" }
                  : theme.world === "sengoku"
                    ? { earth: "#2a1814", scorch: "#4a2820", fire: "#d06030", smoke: "#f0e4d8", skyTop: "#140e0c", skyGlow: "#5a3020" }
                    : { earth: "#101428", scorch: "#243044", fire: "#e07040", smoke: "#c8ffe0", skyTop: "#100c20", skyGlow: "#3a6878" };
  return (
    <group>
      <WarBelow {...palette} />
      {theme.world === "volcano" && (
        <mesh position={[0, -1.1, -18]} raycast={() => null}>
          <coneGeometry args={[5.2, 7.5, 8]} />
          <meshStandardMaterial color="#3a1812" emissive="#ff5a20" emissiveIntensity={0.35} />
        </mesh>
      )}
      {theme.world === "sea" && (
        <mesh position={[0, 8, -20]} raycast={() => null}>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshStandardMaterial color="#f4f0e4" emissive="#fff6dc" emissiveIntensity={0.55} />
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
      {(theme.world === "aurora" || theme.world === "shrine" || theme.world === "neon" || theme.world === "frost") && (
        <Stars count={90} color={theme.world === "neon" ? "#b8fff6" : "#e7f0ff"} radius={40} />
      )}
    </group>
  );
}

function ClassicWorld() {
  return (
    <group>
      <mesh position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial color="#3a2c20" roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[64, 24, 16]} />
        <meshBasicMaterial color="#12100e" side={BackSide} />
      </mesh>
    </group>
  );
}

export function World({ theme }: { theme: BoardTheme }) {
  if (theme.world === "galaxy") return <GalaxyWorld theme={theme} />;
  if (theme.world === "rome") return <RomeWorld />;
  if (theme.world === "sanguo") return <SanguoWorld theme={theme} />;
  if (theme.world === "classic") return <ClassicWorld />;
  return <SimpleWorld theme={theme} />;
}
