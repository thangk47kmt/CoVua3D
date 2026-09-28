import { useEffect, useState, type ComponentType } from "react";
import type { ChessBoardProps } from "./ChessBoard";

export type { ChessBoardProps, LegalDot } from "./ChessBoard";

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
    return <div className="crystal-host" aria-busy="true" aria-label="Đang mở bàn cờ pha lê" />;
  }
  return <Board {...props} />;
}
