import { Chess, type Move } from "chess.js";

export type EngineMove = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
};

const MATE = 100_000;
const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

const PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
  25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
  10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];
const KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
  -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];
const BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10,
  5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
];
const ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
  0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5,
  0, 0, 0,
];
const QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0,
  5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0,
  -10, -20, -10, -10, -5, -5, -10, -10, -20,
];
const KING = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
  -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
];
const KING_END = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20,
  -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30,
  30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

const PST: Record<string, number[]> = {
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  q: QUEEN,
  k: KING,
};

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function evalWhite(chess: Chess): number {
  const board = chess.board();
  let queens = 0;
  let rest = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === "k") continue;
      rest += VAL[piece.type];
      if (piece.type === "q") queens += 1;
    }
  }
  const endgame = queens === 0 && rest < 2400;
  let score = 0;
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) continue;
      const sign = piece.color === "w" ? 1 : -1;
      const table = piece.type === "k" && endgame ? KING_END : PST[piece.type];
      const idx = piece.color === "w" ? rank * 8 + file : (7 - rank) * 8 + file;
      score += sign * (VAL[piece.type] + table[idx]);
    }
  }
  return score;
}

function evaluate(chess: Chess): number {
  const raw = evalWhite(chess);
  return chess.turn() === "w" ? raw : -raw;
}

function moveScore(move: Move): number {
  let score = 0;
  if (move.isPromotion()) score += 900;
  if (move.isCapture()) score += 1200 + VAL[move.captured ?? "p"] * 8 - VAL[move.piece];
  if (move.san.endsWith("#")) score += 4000;
  else if (move.san.endsWith("+")) score += 40;
  return score;
}

function order(moves: Move[], first?: Move | null): Move[] {
  const sorted = moves.slice().sort((a, b) => moveScore(b) - moveScore(a));
  if (!first) return sorted;
  const key = `${first.from}${first.to}${first.promotion ?? ""}`;
  const index = sorted.findIndex((move) => `${move.from}${move.to}${move.promotion ?? ""}` === key);
  if (index > 0) {
    const [pick] = sorted.splice(index, 1);
    sorted.unshift(pick);
  }
  return sorted;
}

function toEngine(move: Move): EngineMove {
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    san: move.san,
  };
}

export function search(fen: string, movetimeMs: number, noise: number, depthCap: number): EngineMove | null {
  const chess = new Chess(fen);
  const rootMoves = chess.moves({ verbose: true });
  if (rootMoves.length === 0) return null;

  if (noise > 0.5 && Math.random() < noise * 0.55) {
    const pick = rootMoves[Math.floor(Math.random() * rootMoves.length)];
    return toEngine(pick);
  }

  const deadline = nowMs() + Math.max(40, movetimeMs);
  let aborted = false;
  let nodes = 0;
  const nodeCap = 180_000;
  let pv: Move | null = null;

  const quiesce = (alphaIn: number, beta: number, left: number): number => {
    nodes += 1;
    if (nodes > nodeCap || nowMs() > deadline) {
      aborted = true;
      return evaluate(chess);
    }
    const inCheck = chess.inCheck();
    let alpha = alphaIn;
    if (!inCheck) {
      const stand = evaluate(chess);
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (left <= 0) return stand;
    } else if (left <= 0) {
      return evaluate(chess);
    }
    let moves = chess.moves({ verbose: true });
    if (moves.length === 0) return inCheck ? -MATE + 8 : 0;
    if (!inCheck) moves = moves.filter((move) => move.isCapture() || move.isPromotion());
    if (moves.length === 0) return alpha;
    for (const move of order(moves)) {
      chess.move(move);
      const score = -quiesce(-beta, -alpha, left - 1);
      chess.undo();
      if (aborted) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  const negamax = (depth: number, ply: number, alphaIn: number, beta: number): number => {
    nodes += 1;
    if (nodes > nodeCap || (depth > 0 && nowMs() > deadline)) {
      aborted = true;
      return evaluate(chess);
    }
    if (depth === 0) return depthCap >= 3 ? quiesce(alphaIn, beta, 2) : evaluate(chess);
    const moves = order(chess.moves({ verbose: true }));
    if (moves.length === 0) return chess.inCheck() ? -MATE + ply : 0;
    let alpha = alphaIn;
    let best = -MATE;
    for (const move of moves) {
      chess.move(move);
      const score = -negamax(depth - 1, ply + 1, -beta, -alpha);
      chess.undo();
      if (aborted) return best;
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  };

  const cap = Math.max(1, Math.min(5, depthCap));
  for (let depth = 1; depth <= cap; depth += 1) {
    aborted = false;
    let localBest = rootMoves[0];
    let localScore = -Infinity;
    for (const move of order(rootMoves, pv)) {
      if (depth > 1 && nowMs() > deadline) {
        aborted = true;
        break;
      }
      chess.move(move);
      const score = -negamax(depth - 1, 1, -MATE, MATE);
      chess.undo();
      if (aborted) break;
      if (score > localScore) {
        localScore = score;
        localBest = move;
      }
    }
    if (aborted && depth > 1) break;
    pv = localBest;
    if (localScore > MATE - 50) break;
  }

  let chosen = pv ?? rootMoves[0];
  if (noise > 0 && Math.random() < noise) {
    const scored = rootMoves.map((move) => {
      chess.move(move);
      const moverWasWhite = chess.turn() === "b";
      const score = moverWasWhite ? evalWhite(chess) : -evalWhite(chess);
      chess.undo();
      return { move, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const band = Math.max(80, 220 * noise);
    const pool = scored.filter((item) => item.score >= scored[0].score - band).slice(0, noise > 0.5 ? 6 : 3);
    chosen = pool[Math.floor(Math.random() * pool.length)]?.move ?? chosen;
  }
  return toEngine(chosen);
}
