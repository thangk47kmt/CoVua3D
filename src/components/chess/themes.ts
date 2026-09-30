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
  world: "galaxy" | "rome" | "sanguo" | "shrine" | "volcano" | "sea" | "aurora" | "nile" | "frost" | "neon" | "viet" | "sengoku" | "classic";
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
    id: "nile",
    name: "Ai Cập",
    sky: "#6a4a28",
    fog: "#6a4a28",
    nebula: ["rgba(212, 168, 74, 0.4)", "rgba(40, 90, 140, 0.28)", "rgba(230, 190, 120, 0.2)"],
    lightFill: "#f6edd4",
    darkFill: "#8a6234",
    frame: "#e4c27a",
    base: "#1a120c",
    spark: "#fff1c8",
    accent: "#ffe7b0",
    pieceTint: "#ffffff",
    pieces: "nile",
    world: "nile",
    aura: "#f0d48a",
    spiritPieces: "kq",
    spiritW: "#fff6dc",
    spiritB: "#c9a24a",
    trail: "#f0d48a",
    burst: "#ffe7c2",
    style: "hop",
    arc: 0.7,
    knightArc: 1.2,
    sway: 0.04,
    dur: 0.64,
    knightDur: 0.82,
    lightA: "#e0b15a",
    lightB: "#2a6a9a",
  },
  {
    id: "frost",
    name: "Băng giá",
    sky: "#1a3048",
    fog: "#1a3048",
    nebula: ["rgba(160, 210, 240, 0.35)", "rgba(40, 80, 120, 0.4)", "rgba(220, 240, 255, 0.2)"],
    lightFill: "#eef6ff",
    darkFill: "#1e3a52",
    frame: "#d5e6f4",
    base: "#0c141c",
    spark: "#f4fbff",
    accent: "#e7f4ff",
    pieceTint: "#ffffff",
    pieces: "frost",
    world: "frost",
    aura: "#c8e8ff",
    spiritPieces: "kq",
    spiritW: "#f4fbff",
    spiritB: "#9ec4e0",
    trail: "#d5e6f4",
    burst: "#eef6ff",
    style: "hop",
    arc: 0.66,
    knightArc: 1.15,
    sway: 0.05,
    dur: 0.62,
    knightDur: 0.8,
    lightA: "#9ec8e8",
    lightB: "#6aa0c8",
  },
  {
    id: "neon",
    name: "Điện tử",
    sky: "#140818",
    fog: "#140818",
    nebula: ["rgba(0, 220, 255, 0.35)", "rgba(255, 40, 160, 0.32)", "rgba(80, 40, 180, 0.28)"],
    lightFill: "#e8fbff",
    darkFill: "#2a1038",
    frame: "#7ef0ff",
    base: "#08040e",
    spark: "#e8fbff",
    accent: "#ffd0f0",
    pieceTint: "#ffffff",
    pieces: "neon",
    world: "neon",
    aura: "#7ef0ff",
    spiritPieces: "kqn",
    spiritW: "#d8fbff",
    spiritB: "#ff9ad4",
    trail: "#7ef0ff",
    burst: "#ff9ad4",
    style: "dash",
    arc: 0.42,
    knightArc: 0.9,
    sway: 0.06,
    dur: 0.46,
    knightDur: 0.62,
    lightA: "#22e0ff",
    lightB: "#ff3aa8",
  },
  {
    id: "viet",
    name: "Đại Việt",
    sky: "#3a2214",
    fog: "#3a2214",
    nebula: ["rgba(160, 40, 24, 0.4)", "rgba(120, 80, 30, 0.35)", "rgba(230, 190, 110, 0.22)"],
    lightFill: "#f6ead2",
    darkFill: "#6a3018",
    frame: "#e0b15a",
    base: "#140e0a",
    spark: "#ffe7b0",
    accent: "#f3d7a0",
    pieceTint: "#ffffff",
    pieces: "viet",
    world: "viet",
    aura: "#f0c56a",
    spiritPieces: "kqn",
    spiritW: "#ffe7b0",
    spiritB: "#e8b0a0",
    trail: "#f0c56a",
    burst: "#ffe7c2",
    style: "dash",
    arc: 0.55,
    knightArc: 1.05,
    sway: 0.05,
    dur: 0.58,
    knightDur: 0.78,
    lightA: "#e0b15a",
    lightB: "#a84830",
  },
  {
    id: "sengoku",
    name: "Sengoku",
    sky: "#2a1814",
    fog: "#2a1814",
    nebula: ["rgba(90, 20, 24, 0.45)", "rgba(40, 30, 28, 0.4)", "rgba(212, 180, 140, 0.2)"],
    lightFill: "#f3ebe0",
    darkFill: "#3a2420",
    frame: "#c4a882",
    base: "#100c0a",
    spark: "#fff1dc",
    accent: "#f0e0c8",
    pieceTint: "#ffffff",
    pieces: "sengoku",
    world: "sengoku",
    aura: "#e8d2b0",
    spiritPieces: "kqn",
    spiritW: "#fff6e8",
    spiritB: "#d8b8a8",
    trail: "#e8d2b0",
    burst: "#ffe7c8",
    style: "dash",
    arc: 0.5,
    knightArc: 1.0,
    sway: 0.04,
    dur: 0.54,
    knightDur: 0.74,
    lightA: "#c4a882",
    lightB: "#8a4030",
  },
  {
    id: "classic",
    name: "Cơ bản",
    sky: "#161310",
    fog: "#161310",
    nebula: ["rgba(40, 32, 24, 0.2)", "rgba(20, 16, 12, 0.2)", "rgba(80, 60, 40, 0.12)"],
    lightFill: "#f0d9b5",
    darkFill: "#b58863",
    frame: "#6b4428",
    base: "#1a120c",
    spark: "#fff6e4",
    accent: "#f3e6c8",
    pieceTint: "#ffffff",
    pieces: "classic",
    world: "classic",
    aura: "#f0e2c4",
    spiritPieces: "",
    spiritW: "#fff6e4",
    spiritB: "#d8c4a4",
    trail: "#e7d3a8",
    burst: "#fff1d4",
    style: "hop",
    arc: 0.55,
    knightArc: 1.05,
    sway: 0,
    dur: 0.42,
    knightDur: 0.58,
    lightA: "#f0e2c4",
    lightB: "#c4a882",
  },
];

const THEME_ORDER = ["crystal", "viet", "sanguo", "classic", "rome", "sengoku", "nile", "anime", "frost", "neon"];
THEMES.sort((a, b) => THEME_ORDER.indexOf(a.id) - THEME_ORDER.indexOf(b.id));

export function themeById(id: string): BoardTheme {
  return THEMES.find((item) => item.id === id) ?? THEMES[0]!;
}

export type TintId = "none" | "ember" | "tide" | "aurora";

export const TINTS: { id: TintId; name: string }[] = [
  { id: "none", name: "Nguyên bản" },
  { id: "ember", name: "Hỏa tinh" },
  { id: "tide", name: "Thủy triều" },
  { id: "aurora", name: "Cực quang" },
];

const TINT_COLOR: Record<Exclude<TintId, "none">, Pick<BoardTheme, "lightFill" | "darkFill" | "frame" | "spark" | "accent" | "pieceTint" | "aura" | "trail" | "burst" | "lightA" | "lightB">> = {
  ember: {
    lightFill: "#f6d2ae",
    darkFill: "#6a160e",
    frame: "#e07a3a",
    spark: "#ffb067",
    accent: "#ffe0b0",
    pieceTint: "#ffc090",
    aura: "#ff7a32",
    trail: "#ff8a3a",
    burst: "#ffd0a0",
    lightA: "#ff5a24",
    lightB: "#ffb060",
  },
  tide: {
    lightFill: "#dff8f4",
    darkFill: "#0d5560",
    frame: "#7ed0c8",
    spark: "#e7fffb",
    accent: "#ffffff",
    pieceTint: "#b6fff0",
    aura: "#7ee0d4",
    trail: "#9aefe4",
    burst: "#d8fff6",
    lightA: "#2ec8c0",
    lightB: "#6aa8ff",
  },
  aurora: {
    lightFill: "#e7f8f1",
    darkFill: "#2a335f",
    frame: "#c2b0ff",
    spark: "#e4ffe8",
    accent: "#f6ecff",
    pieceTint: "#d6ffe6",
    aura: "#8cffc8",
    trail: "#b8ffd8",
    burst: "#e4d8ff",
    lightA: "#46e0a0",
    lightB: "#8a6bff",
  },
};

const RETIRED = new Set(["ember", "tide", "aurora"]);

export function readSavedTheme(): string {
  try {
    const saved = localStorage.getItem("celestial-theme") ?? "crystal";
    if (RETIRED.has(saved)) {
      localStorage.setItem("celestial-tint", saved);
      localStorage.setItem("celestial-theme", "crystal");
      return "crystal";
    }
    return THEMES.some((item) => item.id === saved) ? saved : "crystal";
  } catch {
    return "crystal";
  }
}

export function readSavedTint(): TintId {
  readSavedTheme();
  try {
    const saved = localStorage.getItem("celestial-tint") ?? "none";
    return TINTS.some((item) => item.id === saved) ? (saved as TintId) : "none";
  } catch {
    return "none";
  }
}

/** Color grade over a piece theme. Pieces, sky and world stay the theme's own. */
export function applyTint(theme: BoardTheme, tint: TintId): BoardTheme {
  if (tint === "none") return theme;
  return { ...theme, ...TINT_COLOR[tint], id: `${theme.id}__${tint}` };
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
