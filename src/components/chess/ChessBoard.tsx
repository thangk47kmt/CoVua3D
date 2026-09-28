import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Billboard, useTexture } from "@react-three/drei";
import { Chess } from "chess.js";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Object3D,
  Plane,
  SRGBColorSpace,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type ShaderMaterial,
} from "three";
import type { BoardAnim } from "@/game/notation";
import { pointToSquare, squareCenter } from "@/game/squares";
import { PIECE_HEIGHT, ALL_PIECE_TEXTURES } from "./pieceArt";
import { THEMES, floorMap, glassMap, themeById, type BoardTheme } from "./themes";

export type LegalDot = { to: string; capture: boolean };

export type ChessBoardProps = {
  fen: string;
  flipped: boolean;
  selected: string | null;
  legal: LegalDot[];
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  interactive: boolean;
  anim: BoardAnim | null;
  onSquare: (square: string) => void;
  onAnimDone: () => void;
  autoRotate?: boolean;
};

type Piece = { square: string; type: string; color: "w" | "b" };

const PIECE_MAP = ALL_PIECE_TEXTURES;

const DARK_IDS: string[] = [];
const LIGHT_IDS: string[] = [];
for (let rank = 0; rank < 8; rank += 1) {
  for (let file = 0; file < 8; file += 1) {
    const id = `${String.fromCharCode(97 + file)}${rank + 1}`;
    if ((file + rank) % 2 === 0) DARK_IDS.push(id);
    else LIGHT_IDS.push(id);
  }
}

for (const url of Object.values(PIECE_MAP)) useTexture.preload(url);

function piecesOf(fen: string): Piece[] {
  const chess = new Chess(fen);
  const list: Piece[] = [];
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      list.push({ square: piece.square, type: piece.type, color: piece.color });
    }
  }
  return list;
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

const labels = new Map<string, CanvasTexture>();

function labelTexture(text: string): CanvasTexture {
  const cached = labels.get(text);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = "#e7c98a";
    ctx.font = "700 76px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 68);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  labels.set(text, tex);
  return tex;
}

function nebulaTexture(inner: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grd = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
    grd.addColorStop(0, inner);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function pieceKey(color: "w" | "b", type: string): string {
  const key = `${color}${type.toUpperCase()}`;
  return key === "wK" || key === "wQ" || key === "wR" || key === "wB" || key === "wN" || key === "wP" || key === "bK" || key === "bQ" || key === "bR" || key === "bB" || key === "bN" || key === "bP"
    ? key
    : "wP";
}

let sharedSpirit: CanvasTexture | null = null;

function spiritMap(): CanvasTexture {
  if (sharedSpirit) return sharedSpirit;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grd = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,226,168,0.8)");
    grd.addColorStop(1, "rgba(255,226,168,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  sharedSpirit = tex;
  return tex;
}

function Spirits({ type, color, theme }: { type: string; color: "w" | "b"; theme: BoardTheme }) {
  const count = theme.spiritPieces.includes(type) ? (type === "k" || type === "q" ? 3 : 2) : 0;
  const ref = useRef<Group>(null);
  const map = useMemo(() => spiritMap(), []);
  const spin = theme.style === "dash" ? 2.4 : theme.style === "wave" ? 0.55 : theme.style === "float" ? 0.4 : 0.85;
  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.children.forEach((child, i) => {
      const a = t * (spin + i * 0.28) + (i * Math.PI * 2) / Math.max(1, count);
      const r = 0.42 + (type === "k" ? 0.14 : 0) + i * 0.07;
      const y = (PIECE_HEIGHT[type] ?? 1) * (0.42 + 0.2 * Math.sin(t * 1.7 + i));
      child.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      const s = 0.8 + Math.sin(t * 3.2 + i) * 0.28;
      child.scale.setScalar(s);
    });
  });
  if (!count) return null;
  const tint = color === "w" ? theme.spiritW : theme.spiritB;
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => (
        <Billboard key={i}>
          <mesh raycast={() => null}>
            <planeGeometry args={[theme.style === "dash" ? 0.16 : 0.22, theme.style === "dash" ? 0.16 : 0.22]} />
            <meshBasicMaterial map={map} color={tint} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}

const SPARK_VERT = `
uniform float uTime;
uniform float uScale;
attribute float aSeed;
void main() {
  float tw = sin(uTime * (1.2 + aSeed * 1.6) + aSeed * 6.28318);
  vec3 p = position;
  p.x += sin(uTime * 0.35 + aSeed * 6.0) * 0.05;
  p.y = tw > 0.05 ? position.y + tw * 0.06 : -8.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = 0.05 * (uScale / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

const SPARK_FRAG = `
uniform vec3 uColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.05, d));
}
`;

function Sparkles({ color }: { color: string }) {
  const mat = useRef<ShaderMaterial>(null);
  const geom = useMemo(() => {
    const count = 110;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = 0.35 + Math.random() * 2.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 11;
      seeds[i] = Math.random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return geometry;
  }, []);
  const colorRef = useRef(new Color(color));
  useEffect(() => {
    colorRef.current.set(color);
    if (mat.current) mat.current.uniforms.uColor!.value = colorRef.current;
  }, [color]);
  useFrame(({ clock, size, viewport }) => {
    const material = mat.current;
    if (!material) return;
    material.uniforms.uTime!.value = clock.elapsedTime;
    material.uniforms.uScale!.value = size.height * viewport.dpr * 0.5;
  });
  return (
    <points geometry={geom} raycast={() => null} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uScale: { value: 400 },
          uColor: { value: colorRef.current },
        }}
        vertexShader={SPARK_VERT}
        fragmentShader={SPARK_FRAG}
      />
    </points>
  );
}

function CrystalSprite({
  color,
  type,
  textures,
  theme,
}: {
  color: "w" | "b";
  type: string;
  textures: Record<string, import("three").Texture>;
  theme: BoardTheme;
}) {
  const tex = textures[`${theme.pieces}-${pieceKey(color, type)}`];
  const img = tex.image as { width?: number; height?: number } | undefined;
  const h = (PIECE_HEIGHT[type] ?? 1) * 1.08;
  const aspect = img?.width && img?.height ? Math.min(1.05, Math.max(0.42, img.width / img.height)) : 0.62;
  const glow = useMemo(() => spiritMap(), []);
  return (
    <Billboard position={[0, h / 2, 0]}>
      <mesh position={[0, 0, -0.02]} raycast={() => null}>
        <planeGeometry args={[h * 0.72, h * 0.72]} />
        <meshBasicMaterial map={glow} color={theme.aura} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh raycast={() => null}>
        <planeGeometry args={[h * aspect, h]} />
        <meshBasicMaterial
          map={tex}
          color={theme.pieceTint}
          transparent
          alphaTest={0.12}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  );
}

function StandingPiece({
  piece,
  flipped,
  textures,
  theme,
}: {
  piece: Piece;
  flipped: boolean;
  textures: Record<string, import("three").Texture>;
  theme: BoardTheme;
}) {
  const [x, , z] = squareCenter(piece.square, flipped);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.26, 20]} />
        <meshBasicMaterial color="#05030a" transparent opacity={0.38} />
      </mesh>
      <CrystalSprite color={piece.color} type={piece.type} textures={textures} theme={theme} />
      {theme.spiritPieces.includes(piece.type) && (
        <Spirits type={piece.type} color={piece.color} theme={theme} />
      )}
    </group>
  );
}

function Flight({
  from,
  to,
  piece,
  color,
  flipped,
  capture,
  textures,
  theme,
  onDone,
}: {
  from: string;
  to: string;
  piece: string;
  color: "w" | "b";
  flipped: boolean;
  capture: boolean;
  textures: Record<string, import("three").Texture>;
  theme: BoardTheme;
  onDone?: () => void;
}) {
  const pieceRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const burstRef = useRef<Mesh>(null);
  const motes = useRef<Array<Mesh | null>>([]);
  const started = useRef(0);
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const fromP = squareCenter(from, flipped);
  const toP = squareCenter(to, flipped);
  const arc = piece === "n" ? theme.knightArc : theme.arc;
  const trail = useMemo(() => {
    const count = 22;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      array[i * 3] = fromP[0];
      array[i * 3 + 1] = 0.12;
      array[i * 3 + 2] = fromP[2];
    }
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(array, 3));
    return { geom, array, count };
  }, [fromP[0], fromP[2]]);

  useFrame((state) => {
    if (!started.current) started.current = state.clock.elapsedTime;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0.01 : piece === "n" ? theme.knightDur : theme.dur;
    const raw = Math.min(1, (state.clock.elapsedTime - started.current) / dur);
    const t = theme.style === "dash" ? raw : ease(raw);
    const lift =
      theme.style === "float"
        ? Math.sin(Math.PI * Math.min(1, raw * 0.9)) * arc
        : Math.sin(Math.PI * raw) * arc;
    const sway = Math.sin(Math.PI * raw) * theme.sway;
    const dx = toP[0] - fromP[0];
    const dz = toP[2] - fromP[2];
    const len = Math.hypot(dx, dz) || 1;
    const x = fromP[0] + dx * t + (-dz / len) * sway;
    const z = fromP[2] + dz * t + (dx / len) * sway;
    const settle = raw > 0.78 ? Math.sin(((raw - 0.78) / 0.22) * Math.PI) * 0.1 : 0;
    if (pieceRef.current) {
      pieceRef.current.position.set(x, lift, z);
      pieceRef.current.scale.setScalar(1 + settle);
    }
    if (ringRef.current) {
      const s = 0.55 + lift * 0.7;
      ringRef.current.position.set(x, 0.07, z);
      ringRef.current.scale.setScalar(s);
      const mat = ringRef.current.material as { opacity: number };
      mat.opacity = 0.2 + Math.sin(Math.PI * raw) * 0.55;
    }
    if (burstRef.current) {
      const u = Math.max(0, (raw - 0.62) / 0.38);
      burstRef.current.position.set(toP[0], 0.08, toP[2]);
      burstRef.current.scale.setScalar(0.4 + u * 1.7);
      const mat = burstRef.current.material as { opacity: number };
      mat.opacity = capture ? (1 - u) * 0.85 : (1 - u) * 0.45;
    }
    for (let i = trail.count - 1; i > 0; i -= 1) {
      trail.array[i * 3] = trail.array[(i - 1) * 3] ?? x;
      trail.array[i * 3 + 1] = trail.array[(i - 1) * 3 + 1] ?? 0.12;
      trail.array[i * 3 + 2] = trail.array[(i - 1) * 3 + 2] ?? z;
    }
    trail.array[0] = x;
    trail.array[1] = 0.1 + lift * 0.25;
    trail.array[2] = z;
    const attr = trail.geom.getAttribute("position");
    attr.needsUpdate = true;
    motes.current.forEach((mote, i) => {
      if (!mote) return;
      const lag = Math.max(0, Math.min(1, raw - i * 0.06));
      const u = ease(lag);
      mote.position.set(
        fromP[0] + (toP[0] - fromP[0]) * u,
        Math.sin(Math.PI * lag) * arc * 0.72 + 0.12,
        fromP[2] + (toP[2] - fromP[2]) * u,
      );
      const s = lag <= 0.02 || lag >= 0.98 ? 0.001 : 0.09 - i * 0.008;
      mote.scale.setScalar(Math.max(0.001, s));
    });
    if (raw >= 1 && !finished.current) {
      finished.current = true;
      onDoneRef.current?.();
    }
  });

  return (
    <group>
      <points geometry={trail.geom} raycast={() => null}>
        <pointsMaterial color={theme.trail} size={0.09} transparent opacity={0.85} depthWrite={false} />
      </points>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.22, 0.4, 40]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh ref={burstRef} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.28, 0.4, 40]} />
        <meshBasicMaterial color={theme.burst} transparent opacity={0} depthWrite={false} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            motes.current[i] = node;
          }}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color={i % 2 ? theme.spark : theme.trail} transparent opacity={0.9} />
        </mesh>
      ))}
      <group ref={pieceRef} position={[fromP[0], 0, fromP[2]]}>
        <pointLight color={theme.aura} intensity={6} distance={3.4} decay={2} />
        <CrystalSprite color={color} type={piece} textures={textures} theme={theme} />
        {theme.spiritPieces.includes(piece) && <Spirits type={piece} color={color} theme={theme} />}
      </group>
    </group>
  );
}

function CheckPulse({ square, flipped }: { square: string; flipped: boolean }) {
  const ref = useRef<Mesh>(null);
  const [x, , z] = squareCenter(square, flipped);
  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as { opacity: number };
    mat.opacity = 0.28 + Math.sin(state.clock.elapsedTime * 5) * 0.18;
  });
  return (
    <mesh ref={ref} position={[x, 0.11, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <circleGeometry args={[0.46, 28]} />
      <meshBasicMaterial color="#ff5d6c" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

function Galaxy({ theme }: { theme: BoardTheme }) {
  const violet = useMemo(() => nebulaTexture(theme.nebula[0]), [theme.nebula[0]]);
  const blue = useMemo(() => nebulaTexture(theme.nebula[1]), [theme.nebula[1]]);
  const gold = useMemo(() => nebulaTexture(theme.nebula[2]), [theme.nebula[2]]);
  const stars = useMemo(() => {
    const count = 480;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 14 + Math.random() * 36;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.35) * 22;
      array[i * 3] = Math.cos(theta) * r;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(array, 3));
    return geom;
  }, []);
  return (
    <group>
      <points geometry={stars}>
        <pointsMaterial color="#d5e4ff" size={0.055} transparent opacity={0.8} sizeAttenuation />
      </points>
      <mesh position={[-7, 3.5, -8]} raycast={() => null}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial map={violet} transparent depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh position={[8, 2.2, -9]} raycast={() => null}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial map={blue} transparent depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh position={[1, 5, -6]} raycast={() => null}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial map={gold} transparent depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function BoardFloor({ theme }: { theme: BoardTheme }) {
  const map = useMemo(() => floorMap(theme), [theme]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.64, 0]} raycast={() => null}>
      <circleGeometry args={[28, 48]} />
      <meshBasicMaterial map={map} />
    </mesh>
  );
}

function BoardSheen({ color }: { color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.12) % 1;
    ref.current.position.x = -6 + t * 12;
    const mat = ref.current.material as { opacity: number };
    mat.opacity = 0.1 + Math.sin(clock.elapsedTime * 1.4) * 0.04;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} raycast={() => null}>
      <planeGeometry args={[1.8, 9.2]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
}

type Aim = { x: number; z: number; has: boolean };

function SquareLayer({
  ids,
  flipped,
  map,
  emissive,
}: {
  ids: string[];
  flipped: boolean;
  map: CanvasTexture;
  emissive: string;
}) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    ids.forEach((id, index) => {
      const [x, , z] = squareCenter(id, flipped);
      dummy.position.set(x, 0.02, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, flipped, ids]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, ids.length]} raycast={() => null} frustumCulled={false}>
      <planeGeometry args={[0.98, 0.98]} />
      <meshStandardMaterial map={map} emissive={emissive} emissiveIntensity={0.28} metalness={0.62} roughness={0.14} />
    </instancedMesh>
  );
}

function SquareMark({ square, flipped, color }: { square: string; flipped: boolean; color: string }) {
  const [x, , z] = squareCenter(square, flipped);
  return (
    <mesh position={[x, 0.035, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[0.98, 0.98]} />
      <meshBasicMaterial color={color} transparent opacity={0.34} depthWrite={false} />
    </mesh>
  );
}
  function BoardMesh({
  flipped,
  selected,
  legal,
  lastMove,
  checkSquare,
  interactive,
  onSquare,
  theme,
  aim,
}: {
  flipped: boolean;
  selected: string | null;
  legal: Map<string, LegalDot>;
  lastMove: ChessBoardProps["lastMove"];
  checkSquare: string | null;
  interactive: boolean;
  onSquare: (square: string) => void;
  theme: BoardTheme;
  aim: { current: Aim };
}) {
  const maps = useMemo(
    () => ({ light: glassMap(theme, false), dark: glassMap(theme, true) }),
    [theme],
  );
  const remember = (x: number, z: number) => {
    aim.current.x = Math.max(-3.7, Math.min(3.7, x));
    aim.current.z = Math.max(-3.7, Math.min(3.7, z));
    aim.current.has = true;
  };

  return (
    <group>
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <boxGeometry args={[9.55, 0.58, 9.55]} />
        <meshStandardMaterial color={theme.base} metalness={0.55} roughness={0.38} />
      </mesh>
      {(
        [
          [0, 0.16, 4.62, 9.35, 0.28, 0.38],
          [0, 0.16, -4.62, 9.35, 0.28, 0.38],
          [4.62, 0.16, 0, 0.38, 0.28, 8.9],
          [-4.62, 0.16, 0, 0.38, 0.28, 8.9],
        ] as const
      ).map((bar) => (
        <mesh key={bar.join()} position={[bar[0], bar[1], bar[2]]}>
          <boxGeometry args={[bar[3], bar[4], bar[5]]} />
          <meshStandardMaterial color={theme.frame} metalness={0.9} roughness={0.2} emissive={theme.frame} emissiveIntensity={0.18} />
        </mesh>
      ))}
      <SquareLayer ids={LIGHT_IDS} flipped={flipped} map={maps.light} emissive={theme.lightFill} />
      <SquareLayer ids={DARK_IDS} flipped={flipped} map={maps.dark} emissive={theme.darkFill} />
      {selected && <SquareMark square={selected} flipped={flipped} color={theme.frame} />}
      {lastMove && lastMove.from !== selected && (
        <SquareMark square={lastMove.from} flipped={flipped} color={theme.accent} />
      )}
      {lastMove && lastMove.to !== selected && lastMove.to !== lastMove.from && (
        <SquareMark square={lastMove.to} flipped={flipped} color={theme.accent} />
      )}
      {checkSquare && <CheckPulse square={checkSquare} flipped={flipped} />}
      <BoardSheen color={theme.accent} />
      {(
        [
          [4.2, 4.2],
          [4.2, -4.2],
          [-4.2, 4.2],
          [-4.2, -4.2],
        ] as const
      ).map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.14, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[0.18, 0.3, 6]} />
            <meshStandardMaterial color={theme.frame} metalness={0.9} roughness={0.18} emissive={theme.frame} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.06, 0]} raycast={() => null}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.7} metalness={0.35} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {[...legal.values()].map((dot) => {
        const [x, , z] = squareCenter(dot.to, flipped);
        return dot.capture ? (
          <mesh key={dot.to} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[0.32, 0.42, 20]} />
            <meshBasicMaterial color={theme.accent} transparent opacity={0.95} />
          </mesh>
        ) : (
          <mesh key={dot.to} position={[x, 0.14, z]} raycast={() => null}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color={theme.spark} emissive={theme.accent} emissiveIntensity={0.6} />
          </mesh>
        );
      })}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          remember(event.point.x, event.point.z);
          if (!interactive) return;
          const square = pointToSquare(event.point.x, event.point.z, flipped);
          if (square) onSquare(square);
        }}
        onPointerMove={(event) => {
          remember(event.point.x, event.point.z);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = interactive ? "pointer" : "";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {"abcdefgh".split("").map((letter) => {
        const x = squareCenter(`${letter}1`, flipped)[0];
        return (
          <mesh
            key={letter}
            position={[x, 0.18, flipped ? -4.72 : 4.72]}
            rotation={[-Math.PI / 2, 0, flipped ? Math.PI : 0]}
          >
            <planeGeometry args={[0.46, 0.46]} />
            <meshBasicMaterial map={labelTexture(letter)} transparent toneMapped={false} />
          </mesh>
        );
      })}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((rank) => {
        const z = squareCenter(`a${rank}`, flipped)[2];
        return (
          <mesh
            key={rank}
            position={[flipped ? 4.72 : -4.72, 0.18, z]}
            rotation={[-Math.PI / 2, 0, flipped ? Math.PI : 0]}
          >
            <planeGeometry args={[0.46, 0.46]} />
            <meshBasicMaterial map={labelTexture(String(rank))} transparent toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

type CamApi = {
  zoom: (dir: "in" | "out", factor?: number) => void;
  reset: () => void;
};

function PointerFocus({ aim }: { aim: { current: Aim } }) {
  const hit = useRef(new Vector3());
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const last = useRef({ x: 9, y: 9 });
  useFrame(({ camera, pointer, raycaster }) => {
    if (pointer.x === last.current.x && pointer.y === last.current.y) return;
    last.current.x = pointer.x;
    last.current.y = pointer.y;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane, hit.current)) return;
    const x = hit.current.x;
    const z = hit.current.z;
    if (Math.abs(x) > 4.3 || Math.abs(z) > 4.3) return;
    aim.current.x = x;
    aim.current.z = z;
    aim.current.has = true;
  });
  return null;
}

function Rig({
  flipped,
  autoRotate,
  cam,
  aim,
  selectedRef,
  flippedRef,
}: {
  flipped: boolean;
  autoRotate?: boolean;
  cam: { current: CamApi };
  aim: { current: Aim };
  selectedRef: { current: string | null };
  flippedRef: { current: boolean };
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as {
    target: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
    update: () => void;
  } | null;
  useEffect(() => {
    const place = () => {
      const aspect = size.width / Math.max(1, size.height);
      const tight = size.height < 560 || aspect < 0.95;
      const dist = tight ? 18.5 : aspect > 1.65 ? 15.2 : 13.4;
      const lift = tight ? 0.58 : 0.52;
      const y = dist * lift;
      const horizontal = dist * Math.sqrt(Math.max(0.2, 1 - lift * lift));
      camera.position.set(0, y, (flipped ? -1 : 1) * horizontal);
      camera.lookAt(0, 0.2, 0);
      controls?.target.set(0, 0.2, 0);
      controls?.update();
    };
    const retarget = () => {
      if (!controls) return;
      const square = selectedRef.current;
      let x = aim.current.x;
      let z = aim.current.z;
      if (square) {
        const point = squareCenter(square, flippedRef.current);
        x = point[0];
        z = point[2];
      } else if (!aim.current.has) {
        return;
      }
      const y = 0.45;
      const dx = x - controls.target.x;
      const dz = z - controls.target.z;
      const dy = y - controls.target.y;
      controls.target.set(x, y, z);
      camera.position.x += dx;
      camera.position.y += dy;
      camera.position.z += dz;
    };
    const dolly = (factor: number) => {
      if (!controls) return;
      const ox = camera.position.x - controls.target.x;
      const oy = camera.position.y - controls.target.y;
      const oz = camera.position.z - controls.target.z;
      const dist = Math.hypot(ox, oy, oz) || 1;
      const next = Math.min(22, Math.max(2.7, dist * factor));
      const scale = next / dist;
      camera.position.set(controls.target.x + ox * scale, controls.target.y + oy * scale, controls.target.z + oz * scale);
      controls.update();
    };
    place();
    cam.current.zoom = (dir, factor) => {
      retarget();
      dolly(factor ?? (dir === "in" ? 0.62 : 1.62));
    };
    cam.current.reset = place;

    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      cam.current.zoom(event.deltaY < 0 ? "in" : "out", event.deltaY < 0 ? 0.9 : 1.11);
    };
    const onDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinch = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId) || pointers.size < 2) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      if (pinch <= 0) {
        pinch = dist;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const factor = dist > pinch ? Math.max(0.86, pinch / dist) : Math.min(1.16, pinch / dist);
      cam.current.zoom(dist > pinch ? "in" : "out", factor);
      pinch = dist;
    };
    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      pinch = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel, true);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [aim, cam, camera, controls, flipped, flippedRef, gl, selectedRef, size.height, size.width]);
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.4}
      maxPolarAngle={1.32}
      minDistance={2.7}
      maxDistance={22}
      autoRotate={!!autoRotate}
      autoRotateSpeed={0.42}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function Scene(
  props: ChessBoardProps & {
    cam: { current: CamApi };
    aim: { current: Aim };
    theme: BoardTheme;
    selectedRef: { current: string | null };
    flippedRef: { current: boolean };
  },
) {
  const textures = useTexture(PIECE_MAP);
  useEffect(() => {
    for (const tex of Object.values(textures)) {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
    }
  }, [textures]);
  const hidden = new Set(props.anim?.hide ?? []);
  const pieces = useMemo(() => piecesOf(props.fen), [props.fen]);
  const legal = useMemo(() => {
    const map = new Map<string, LegalDot>();
    for (const dot of props.legal) map.set(dot.to, dot);
    return map;
  }, [props.legal]);
  const capture = Boolean(props.anim && props.anim.hide.includes(props.anim.to));
  props.selectedRef.current = props.selected;
  props.flippedRef.current = props.flipped;

  return (
    <>
      <color attach="background" args={[props.theme.sky]} />
      <fog attach="fog" args={[props.theme.fog, 18, 46]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 12, 6]} intensity={1.55} color={props.theme.accent} />
      <pointLight position={[-6, 4, -3]} intensity={18} color={props.theme.lightA} distance={22} />
      <pointLight position={[6, 3, 5]} intensity={12} color={props.theme.lightB} distance={18} />
      <Galaxy theme={props.theme} />
      <BoardFloor theme={props.theme} />
      <Sparkles color={props.theme.spark} />
      <PointerFocus aim={props.aim} />
      <Rig
        flipped={props.flipped}
        autoRotate={props.autoRotate}
        cam={props.cam}
        aim={props.aim}
        selectedRef={props.selectedRef}
        flippedRef={props.flippedRef}
      />
      <BoardMesh
        flipped={props.flipped}
        selected={props.selected}
        legal={legal}
        lastMove={props.lastMove}
        checkSquare={props.checkSquare}
        interactive={props.interactive}
        onSquare={props.onSquare}
        theme={props.theme}
        aim={props.aim}
      />
      {pieces.map((piece) => {
        if (hidden.has(piece.square)) return null;
        return (
          <StandingPiece
            key={`${piece.square}-${piece.color}${piece.type}`}
            piece={piece}
            flipped={props.flipped}
            textures={textures}
            theme={props.theme}
          />
        );
      })}
      {props.anim && (
        <>
          <Flight
            key={props.anim.id}
            from={props.anim.from}
            to={props.anim.to}
            piece={props.anim.piece}
            color={props.anim.color}
            flipped={props.flipped}
            capture={capture}
            textures={textures}
            theme={props.theme}
            onDone={props.onAnimDone}
          />
          {props.anim.rookFrom && props.anim.rookTo && (
            <Flight
              from={props.anim.rookFrom}
              to={props.anim.rookTo}
              piece="r"
              color={props.anim.color}
              flipped={props.flipped}
              capture={false}
              textures={textures}
              theme={props.theme}
            />
          )}
        </>
      )}
    </>
  );
}

export function ChessBoard(props: ChessBoardProps) {
  const cam = useRef<CamApi>({
    zoom() {},
    reset() {},
  });
  const aim = useRef<Aim>({ x: 0, z: 0, has: false });
  const selectedRef = useRef<string | null>(null);
  const flippedRef = useRef(false);
  const [themeId, setThemeId] = useState("crystal");
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem("celestial-theme");
        if (saved && THEMES.some((item) => item.id === saved)) setThemeId(saved);
      } catch {
        /* ignore private mode */
      }
    };
    read();
    window.addEventListener("celestial-theme", read);
    return () => window.removeEventListener("celestial-theme", read);
  }, []);
  const theme = themeById(themeId);
  return (
    <div className="crystal-host" aria-label="Bàn cờ pha lê">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 6.5, 11.2], fov: 32, near: 0.08, far: 90 }}
          dpr={[1, 1.35]}
          performance={{ min: 0.65 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
          style={{ width: "100%", height: "100%", touchAction: "none" }}
        >
          <Suspense fallback={null}>
            <Scene {...props} cam={cam} aim={aim} theme={theme} selectedRef={selectedRef} flippedRef={flippedRef} />
          </Suspense>
        </Canvas>
      </div>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button type="button" className="btn h-9 min-h-0 w-9 px-0" onClick={() => cam.current.zoom("in")} aria-label="Phóng gần">
          +
        </button>
        <button type="button" className="btn h-9 min-h-0 w-9 px-0" onClick={() => cam.current.zoom("out")} aria-label="Thu xa">
          −
        </button>
        <button type="button" className="btn h-9 min-h-0 px-2 text-xs" onClick={() => cam.current.reset()}>
          Góc
        </button>
      </div>
    </div>
  );
}
