import { Chess, type Square } from "chess.js";

export type Outcome = {
  status: "playing" | "finished";
  result: "1-0" | "0-1" | "1/2-1/2" | null;
  reason: string | null;
  text: string;
  inCheck: boolean;
};

export function outcome(chess: Chess): Outcome {
  const inCheck = chess.inCheck();
  if (chess.isCheckmate()) {
    const whiteWins = chess.turn() === "b";
    return {
      status: "finished",
      result: whiteWins ? "1-0" : "0-1",
      reason: "checkmate",
      text: whiteWins ? "Chiếu hết — Trắng thắng" : "Chiếu hết — Đen thắng",
      inCheck: true,
    };
  }
  if (chess.isStalemate()) {
    return {
      status: "finished",
      result: "1/2-1/2",
      reason: "stalemate",
      text: "Hòa — pat. Hết nước đi nhưng vua không bị chiếu.",
      inCheck: false,
    };
  }
  if (chess.isThreefoldRepetition()) {
    return {
      status: "finished",
      result: "1/2-1/2",
      reason: "repetition",
      text: "Hòa — lặp lại thế cờ ba lần.",
      inCheck,
    };
  }
  if (chess.isInsufficientMaterial()) {
    return {
      status: "finished",
      result: "1/2-1/2",
      reason: "insufficient",
      text: "Hòa — không đủ lực để chiếu hết.",
      inCheck: false,
    };
  }
  if (chess.isDraw()) {
    return {
      status: "finished",
      result: "1/2-1/2",
      reason: "fifty",
      text: "Hòa — luật 50 nước không ăn quân, không đẩy tốt.",
      inCheck,
    };
  }
  const side = chess.turn() === "w" ? "Trắng" : "Đen";
  return {
    status: "playing",
    result: null,
    reason: null,
    text: inCheck ? `Chiếu — lượt ${side}` : `Lượt ${side}`,
    inCheck,
  };
}

export function kingSquare(chess: Chess, color: "w" | "b"): string | null {
  for (const row of chess.board()) {
    for (const piece of row) {
      if (piece?.type === "k" && piece.color === color) return piece.square;
    }
  }
  return null;
}

export function asSquare(sq: string): Square {
  return sq as Square;
}
