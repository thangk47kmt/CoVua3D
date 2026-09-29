import { CanvasTexture, SRGBColorSpace } from "three";
import type { PieceSetId } from "./pieceArt";

export type MoveStyle = "hop" | "dash" | "wave" | "float";

export type BoardTheme = {
  id: string;
  name: string;
  sky: string;
  fog: string;
  nebula: [string, string, string];
  lightFill: string;
  darkFill: string;
  frame: string;
  base: string;
  spark: string;
  accent: string;
  pieceTint: string;
  pieces: PieceSetId;
  world: "galaxy" | "rome" | "sanguo" | "shrine" | "volcano" | "sea" | "aurora";
  aura: string;
  spiritPieces: string;
  spiritW: string;
  spiritB: string;
  trail: string;
  burst: string;
  style: MoveStyle;
  arc: number;
  knightArc: number;
  sway: number;
  dur: number;
  knightDur: number;
  lightA: string;
  lightB: string;
};

export const THEMES: BoardTheme[] = [
  {
    id: "crystal",
    name: "Thiên hà",
    sky: "#16306e",
    fog: "#16306e",
    nebula: ["rgba(124, 64, 210, 0.55)", "rgba(40, 96, 220, 0.5)", "rgba(210, 160, 70, 0.28)"],
    lightFill: "#e7f3ff",
    darkFill: "#1a4f9e",
    frame: "#e4c27a",
    base: "#100c14",
    spark: "#fff6dc",
    accent: "#fff4d2",
    pieceTint: "#ffffff",
    pieces: "crystal",
    world: "galaxy",
    aura: "#ffe7b8",
    spiritPieces: "kqn",
    spiritW: "#fff6dc",
    spiritB: "#e4d4ff",
    trail: "#ffe3a6",
    burst: "#f3e7c2",
    style: "hop",
    arc: 0.9,
    knightArc: 1.55,
    sway: 0,
    dur: 0.68,
    knightDur: 0.86,
    lightA: "#7a4bff",
    lightB: "#3d78ff",
  },
  {
    id: "rome",
    name: "La Mã",
    sky: "#6e5840",
    fog: "#6e5840",
    nebula: ["rgba(160, 90, 40, 0.35)", "rgba(90, 60, 30, 0.3)", "rgba(230, 190, 120, 0.2)"],
    lightFill: "#f4e7cf",
    darkFill: "#8a6846",
    frame: "#f3ead8",
    base: "#4a3828",
    spark: "#fff1d2",
    accent: "#ffe7b0",
    pieceTint: "#ffffff",
    pieces: "rome",
    world: "rome",
    aura: "#e7d3a4",
    spiritPieces: "kqn",
    spiritW: "#fff4dc",
    spiritB: "#ffb0a0",
    trail: "#f0d8a8",
    burst: "#ffe7c4",
    style: "hop",
    arc: 0.72,
    knightArc: 1.25,
    sway: 0.04,
    dur: 0.62,
    knightDur: 0.82,
    lightA: "#e0b56a",
    lightB: "#c47848",
  },
  {
    id: "anime",
    name: "Anime",
    sky: "#2a1848",
    fog: "#2a1848",
    nebula: ["rgba(180, 80, 210, 0.45)", "rgba(70, 90, 210, 0.4)", "rgba(255, 180, 210, 0.22)"],
    lightFill: "#fde7f3",
    darkFill: "#3a2a78",
    frame: "#e7b4d8",
    base: "#140e1c",
    spark: "#ffe4f4",
    accent: "#fff0c8",
    pieceTint: "#ffffff",
    pieces: "anime",
    world: "shrine",
    aura: "#ffd0ea",
    spiritPieces: "kqn",
    spiritW: "#fff6dc",
    spiritB: "#e4d4ff",
    trail: "#ffd0ea",
    burst: "#ffe7f6",
    style: "float",
    arc: 1.15,
    knightArc: 1.6,
    sway: 0.16,
    dur: 0.8,
    knightDur: 0.95,
    lightA: "#c45cff",
    lightB: "#7aa2ff",
  },
  {
    id: "sanguo",
    name: "Tam quốc",
    sky: "#3a140e",
    fog: "#3a140e",
    nebula: ["rgba(140, 24, 18, 0.45)", "rgba(90, 50, 16, 0.4)", "rgba(212, 168, 74, 0.22)"],
    lightFill: "#f3e2c4",
    darkFill: "#5c1a14",
    frame: "#d4a84a",
    base: "#140c0a",
    spark: "#ffe7b0",
    accent: "#f0d48a",
    pieceTint: "#ffffff",
    pieces: "sanguo",
    world: "sanguo",
    aura: "#f0c56a",
    spiritPieces: "kqn",
    spiritW: "#ffe7b0",
    spiritB: "#ffb0a0",
    trail: "#f0c56a",
    burst: "#ffe7c2",
    style: "dash",
    arc: 0.7,
    knightArc: 1.35,
    sway: 0.05,
    dur: 0.58,
    knightDur: 0.78,
    lightA: "#c4482a",
    lightB: "#e0b15a",
  },
  {
    id: "ember",
    name: "Hỏa tinh",
    sky: "#4a1a14",
    fog: "#4a1a14",
    nebula: ["rgba(190, 48, 18, 0.55)", "rgba(90, 16, 8, 0.48)", "rgba(255, 150, 40, 0.24)"],
    lightFill: "#f6d2ae",
    darkFill: "#6a160e",
    frame: "#e07a3a",
    base: "#1a0906",
    spark: "#ffb067",
    accent: "#ffe0b0",
    pieceTint: "#ffffff",
    pieces: "ember",
    world: "volcano",
    aura: "#ff7a32",
    spiritPieces: "kqr",
    spiritW: "#ffe0a8",
    spiritB: "#ff6a3a",
    trail: "#ff8a3a",
    burst: "#ffd0a0",
    style: "dash",
    arc: 0.26,
    knightArc: 0.62,
    sway: 0.04,
    dur: 0.36,
    knightDur: 0.48,
    lightA: "#ff5a24",
    lightB: "#ffb060",
  },
  {
    id: "tide",
    name: "Thủy triều",
    sky: "#0c4a52",
    fog: "#0c4a52",
    nebula: ["rgba(20, 130, 150, 0.5)", "rgba(30, 70, 150, 0.38)", "rgba(170, 240, 230, 0.22)"],
    lightFill: "#dff8f4",
    darkFill: "#0d5560",
    frame: "#7ed0c8",
    base: "#062026",
    spark: "#e7fffb",
    accent: "#ffffff",
    pieceTint: "#ffffff",
    pieces: "tide",
    world: "sea",
    aura: "#7ee0d4",
    spiritPieces: "qbn",
    spiritW: "#e8fff8",
    spiritB: "#7ec8ff",
    trail: "#9aefe4",
    burst: "#d8fff6",
    style: "wave",
    arc: 0.4,
    knightArc: 0.82,
    sway: 0.42,
    dur: 0.84,
    knightDur: 0.98,
    lightA: "#2ec8c0",
    lightB: "#6aa8ff",
  },
  {
    id: "aurora",
    name: "Cực quang",
    sky: "#24184e",
    fog: "#24184e",
    nebula: ["rgba(70, 220, 160, 0.38)", "rgba(130, 70, 220, 0.48)", "rgba(80, 170, 255, 0.28)"],
    lightFill: "#e7f8f1",
    darkFill: "#2a335f",
    frame: "#c2b0ff",
    base: "#0c1020",
    spark: "#e4ffe8",
    accent: "#f6ecff",
    pieceTint: "#ffffff",
    pieces: "aurora",
    world: "aurora",
    aura: "#8cffc8",
    spiritPieces: "kb",
    spiritW: "#e8ffe8",
    spiritB: "#c8b0ff",
    trail: "#b8ffd8",
    burst: "#e4d8ff",
    style: "float",
    arc: 1.4,
    knightArc: 1.75,
    sway: 0.2,
    dur: 0.98,
    knightDur: 1.08,
    lightA: "#46e0a0",
    lightB: "#8a6bff",
  },
];

export function themeById(id: string): BoardTheme {
  return THEMES.find((item) => item.id === id) ?? THEMES[0]!;
}

const floorCache = new Map<string, CanvasTexture>();
const glassCache = new Map<string, CanvasTexture>();

export function floorMap(theme: BoardTheme): CanvasTexture {
  const cached = floorCache.get(theme.id);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grd = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grd.addColorStop(0, theme.lightB);
    grd.addColorStop(0.45, theme.sky);
    grd.addColorStop(1, theme.sky);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  floorCache.set(theme.id, tex);
  return tex;
}

export function glassMap(theme: BoardTheme, dark: boolean): CanvasTexture {
  const key = `v4:${theme.id}:${dark ? "d" : "l"}`;
  const cached = glassCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = dark ? theme.darkFill : theme.lightFill;
    ctx.fillRect(0, 0, 256, 256);
    const top = ctx.createLinearGradient(0, 0, 0, 256);
    top.addColorStop(0, "rgba(255,255,255,0.55)");
    top.addColorStop(0.07, "rgba(255,255,255,0)");
    top.addColorStop(0.93, "rgba(0,0,0,0)");
    top.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, 256, 256);
    const side = ctx.createLinearGradient(0, 0, 256, 0);
    side.addColorStop(0, "rgba(255,255,255,0.28)");
    side.addColorStop(0.08, "rgba(255,255,255,0)");
    side.addColorStop(0.92, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, 256, 256);
    const glint = ctx.createRadialGradient(72, 58, 0, 72, 58, 42);
    glint.addColorStop(0, "rgba(255,255,255,0.7)");
    glint.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glint;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = dark ? 0.9 : 0.45;
    ctx.fillStyle = theme.frame;
    star(ctx, 128, 128, 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(128, 128, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    for (const [x, y, r] of [
      [46, 40, 1.5],
      [210, 52, 1.2],
      [38, 200, 1.3],
      [214, 188, 1.6],
      [168, 36, 1.1],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  glassCache.set(key, tex);
  return tex;
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.38;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
