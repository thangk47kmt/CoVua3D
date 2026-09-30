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

function moveKey(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

function sqIndex(square: string): number {
  return square.charCodeAt(0) - 97 + (square.charCodeAt(1) - 49) * 8;
}

function orderMoves(
  moves: Move[],
  ply: number,
  first?: string | null,
  killers?: string[],
  history?: Int32Array,
): Move[] {
  const scored = moves.map((move) => {
    const key = moveKey(move);
    let score = 0;
    if (first && key === first) score += 40_000;
    if (move.isPromotion()) score += 9_000;
    if (move.isCapture()) score += 12_000 + VAL[move.captured ?? "p"] * 8 - VAL[move.piece];
    else if (killers) {
      if (key === killers[ply * 2]) score += 6_000;
      else if (key === killers[ply * 2 + 1]) score += 5_000;
      if (history) {
        const color = move.color === "w" ? 0 : 1;
        score += history[color * 4096 + sqIndex(move.from) * 64 + sqIndex(move.to)] ?? 0;
      }
    }
    if (move.san.endsWith("#")) score += 20_000;
    else if (move.san.endsWith("+")) score += 80;
    return { move, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.move);
}

function rememberKiller(killers: string[], ply: number, key: string) {
  const slot = ply * 2;
  if (killers[slot] === key) return;
  killers[slot + 1] = killers[slot] ?? "";
  killers[slot] = key;
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
  if (rootMoves.length === 1) return toEngine(rootMoves[0]);

  const cap = Math.max(1, Math.min(5, depthCap));
  const deadline = nowMs() + Math.max(40, movetimeMs);
  const killers = new Array<string>(128).fill("");
  const history = new Int32Array(8192);
  let aborted = false;
  let pvKey = "";
  let finished: { move: Move; score: number }[] = [];

  const mateScore = (ply: number) => -MATE + ply;

  const negamax = (depth: number, ply: number, alphaIn: number, beta: number): number => {
    if (depth > 0 && nowMs() > deadline) {
      aborted = true;
      return evaluate(chess);
    }
    if (depth === 0) {
      if (chess.inCheck() && chess.moves().length === 0) return mateScore(ply);
      return evaluate(chess);
    }

    const checking = chess.inCheck();
    const moves = orderMoves(chess.moves({ verbose: true }), ply, null, killers, history);
    if (moves.length === 0) return checking ? mateScore(ply) : 0;

    let alpha = alphaIn;
    let best = -MATE;
    for (let index = 0; index < moves.length; index += 1) {
      const move = moves[index];
      const quiet = !move.isCapture() && !move.isPromotion() && !checking;
      chess.move(move);
      const score = -negamax(depth - 1, ply + 1, -beta, -alpha);
      chess.undo();
      if (aborted) return best;
      if (score > best) best = score;
      if (score > alpha) {
        alpha = score;
        if (alpha >= beta) {
          if (quiet) {
            rememberKiller(killers, ply, moveKey(move));
            const color = move.color === "w" ? 0 : 1;
            history[color * 4096 + sqIndex(move.from) * 64 + sqIndex(move.to)] += depth * depth;
          }
          break;
        }
      }
    }
    return best;
  };

  const wideCap = Math.min(cap, 2);
  for (let depth = 1; depth <= wideCap; depth += 1) {
    aborted = false;
    const iter: { move: Move; score: number }[] = [];
    let localBest = rootMoves[0];
    let localScore = -Infinity;
    const ordered = orderMoves(rootMoves, 0, pvKey || null, killers, history);
    for (const move of ordered) {
      if (depth > 1 && nowMs() > deadline) {
        aborted = true;
        break;
      }
      chess.move(move);
      const score = -negamax(depth - 1, 1, -MATE, MATE);
      chess.undo();
      if (aborted) break;
      iter.push({ move, score });
      if (score > localScore) {
        localScore = score;
        localBest = move;
      }
    }
    if ((aborted && depth > 1) || iter.length === 0) break;
    finished = iter;
    pvKey = moveKey(localBest);
    if (localScore > MATE - 80) break;
  }

  if (finished.length === 0) return toEngine(rootMoves[0]);
  finished.sort((a, b) => b.score - a.score);

  if (cap >= 3 && finished[0].score < MATE - 80) {
    const width = cap >= 4 ? 5 : 3;
    const confirmed: { move: Move; score: number }[] = [];
    for (const item of finished.slice(0, width)) {
      if (nowMs() + 40 > deadline) break;
      aborted = false;
      chess.move(item.move);
      const score = -negamax(2, 1, -MATE, MATE);
      chess.undo();
      if (aborted) break;
      confirmed.push({ move: item.move, score });
    }
    let picked = confirmed;
    if (cap >= 4 && confirmed.length >= 2) {
      confirmed.sort((a, b) => b.score - a.score);
      const deeper: { move: Move; score: number }[] = [];
      const probe = confirmed.slice();
      for (const item of probe) {
        if (nowMs() + 40 > deadline) break;
        aborted = false;
        chess.move(item.move);
        const score = -negamax(3, 1, -MATE, MATE);
        chess.undo();
        if (aborted) break;
        deeper.push({ move: item.move, score });
      }
      if (deeper.length === probe.length) picked = deeper;
    }
    if (picked.length > 0) {
      picked.sort((a, b) => b.score - a.score);
      finished = picked;
    }
  }

  let chosen = finished[0].move;
  if (noise > 0 && Math.random() < noise) {
    if (noise >= 0.55 && Math.random() < 0.62) {
      chosen = rootMoves[Math.floor(Math.random() * rootMoves.length)];
    } else {
      const slack = noise >= 0.55 ? 720 : noise >= 0.2 ? 280 : 110;
      const pool = finished.filter(
        (item) => item.score <= finished[0].score - 15 && item.score >= finished[0].score - slack,
      );
      if (pool.length > 0) chosen = pool[Math.floor(Math.random() * pool.length)].move;
    }
  }
  return toEngine(chosen);
}
