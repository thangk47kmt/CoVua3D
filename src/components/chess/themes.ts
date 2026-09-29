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
    name: "Pha lê",
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
  const key = `v3:${theme.id}:${dark ? "d" : "l"}`;
  const cached = glassCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const base = ctx.createLinearGradient(0, 0, 256, 256);
    base.addColorStop(0, dark ? theme.darkFill : "#ffffff");
    base.addColorStop(0.5, dark ? theme.darkFill : theme.lightFill);
    base.addColorStop(1, dark ? theme.base : theme.lightFill);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    const glow = ctx.createRadialGradient(118, 96, 4, 128, 128, 140);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.22, theme.aura);
    glow.addColorStop(0.55, dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.28)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-20, 210);
    ctx.lineTo(210, -20);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.accent;
    star(ctx, 128, 128, dark ? 28 : 18);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(128, 128, dark ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 28; i += 1) {
      const x = 18 + ((i * 47) % 220);
      const y = 16 + ((i * 83) % 224);
      const r = i % 5 === 0 ? 3.2 : 1.4;
      ctx.globalAlpha = i % 3 === 0 ? 0.95 : 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (i % 4 === 0) {
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x - 5, y - 0.6, 10, 1.2);
        ctx.fillRect(x - 0.6, y - 5, 1.2, 10);
      }
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
