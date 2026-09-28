import { Chess, type Move } from "chess.js";

export type BoardAnim = {
  id: number;
  from: string;
  to: string;
  piece: string;
  color: "w" | "b";
  rookFrom?: string;
  rookTo?: string;
  hide: string[];
};

const NAMES: Record<string, string> = {
  p: "Tốt",
  n: "Mã",
  b: "Tượng",
  r: "Xe",
  q: "Hậu",
  k: "Vua",
};

const GLYPH: Record<string, string> = {
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

export function pieceName(type: string): string {
  return NAMES[type] ?? type;
}

export function bridgeAnim(before: string, after: string, id: number): BoardAnim | null {
  let chess: Chess;
  try {
    chess = new Chess(before);
  } catch {
    return null;
  }
  const move = chess.moves({ verbose: true }).find((item) => item.after === after);
  if (!move) return null;
  return animFromMove(move, id);
}
export function animFromMove(move: Move, id: number): BoardAnim {
  const hide: string[] = [move.from];
  let rookFrom: string | undefined;
  let rookTo: string | undefined;
  if (move.isKingsideCastle()) {
    rookFrom = move.color === "w" ? "h1" : "h8";
    rookTo = move.color === "w" ? "f1" : "f8";
    hide.push(rookFrom);
  } else if (move.isQueensideCastle()) {
    rookFrom = move.color === "w" ? "a1" : "a8";
    rookTo = move.color === "w" ? "d1" : "d8";
    hide.push(rookFrom);
  } else if (move.isEnPassant()) {
    hide.push(`${move.to[0]}${move.from[1]}`);
  } else if (move.isCapture()) {
    hide.push(move.to);
  }
  return {
    id,
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    rookFrom,
    rookTo,
    hide,
  };
}

export function capturedSets(fen: string): { byWhite: string; byBlack: string; diff: number } {
  const start: Record<string, number> = { P: 8, N: 2, B: 2, R: 2, Q: 1, p: 8, n: 2, b: 2, r: 2, q: 1 };
  const have: Record<string, number> = { P: 0, N: 0, B: 0, R: 0, Q: 0, p: 0, n: 0, b: 0, r: 0, q: 0 };
  for (const ch of fen.split(" ")[0] ?? "") {
    if (ch in have) have[ch] += 1;
  }
  const value: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let byWhite = "";
  let byBlack = "";
  let diff = 0;
  for (const type of ["q", "r", "b", "n", "p"]) {
    const whiteMissing = start[type.toUpperCase()] - have[type.toUpperCase()];
    const blackMissing = start[type] - have[type];
    byBlack += (GLYPH[type.toUpperCase()] ?? "").repeat(Math.max(0, whiteMissing));
    byWhite += (GLYPH[type] ?? "").repeat(Math.max(0, blackMissing));
    diff += (blackMissing - whiteMissing) * value[type];
  }
  return { byWhite, byBlack, diff };
}

export function moveRows(sans: string[]): { n: number; w?: string; b?: string }[] {
  const rows: { n: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: sans[i], b: sans[i + 1] });
  }
  return rows;
}

export function resultLabel(result: string | null, reason: string | null): string {
  if (!result) return "Đang diễn ra";
  const who = result === "1-0" ? "Trắng thắng" : result === "0-1" ? "Đen thắng" : "Hòa";
  const why: Record<string, string> = {
    checkmate: "chiếu hết",
    resign: "xin thua",
    stalemate: "pat",
    repetition: "lặp ba lần",
    insufficient: "không đủ lực",
    fifty: "luật 50 nước",
    draw: "thoả thuận hòa",
  };
  return reason && why[reason] ? `${who} — ${why[reason]}` : who;
}
