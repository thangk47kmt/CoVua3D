import { useEffect, useState, type ComponentType } from "react";
import type { ChessBoardProps } from "./ChessBoard";

export type { ChessBoardProps, LegalDot } from "./ChessBoard";

export function BoardSplash() {
  return (
    <div className="board-splash" role="status" aria-live="polite">
      <div className="board-splash-card">
        <p className="board-splash-kicker">Celestial Crystal</p>
        <p className="board-splash-title">Đang dựng bàn cờ</p>
        <span className="board-splash-bar" aria-hidden="true" />
      </div>
    </div>
  );
}

export function ClientBoard(props: ChessBoardProps) {
  const [Board, setBoard] = useState<ComponentType<ChessBoardProps> | null>(null);
  useEffect(() => {
    let live = true;
    void import("./ChessBoard").then((mod) => {
      if (live) setBoard(() => mod.ChessBoard);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!Board) {
    return (
      <div className="crystal-host" aria-busy="true">
        <BoardSplash />
      </div>
    );
  }
  return <Board {...props} />;
}