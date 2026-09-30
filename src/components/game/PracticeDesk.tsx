import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { ClientBoard } from "@/components/chess/ClientBoard";
import { PromotionDialog, SoundButton } from "@/components/chess/MatchChrome";
import { playFx, unlockAudio } from "@/game/audio";
import { LESSONS, type Lesson } from "@/game/lessons";
import { asSquare, kingSquare } from "@/game/rules";

type Promo = { from: string; to: string };

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function goalMet(lesson: Lesson, from: string, to: string, promotion?: string): boolean {
  if (lesson.anyMove) return true;
  const goal = lesson.goal;
  if (!goal || goal.from !== from || goal.to !== to) return false;
  if (!goal.promotion || goal.promotion === "any") return true;
  return goal.promotion === promotion;
}

export function PracticeDesk() {
  const [index, setIndex] = useState(0);
  const [free, setFree] = useState(false);
  const lesson = LESSONS[index] ?? LESSONS[0]!;
  const chessRef = useRef(new Chess(lesson.fen));
  const [fen, setFen] = useState(lesson.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [stamp, setStamp] = useState(0);

  function load(nextFen: string) {
    chessRef.current = new Chess(nextFen);
    setFen(nextFen);
    setSelected(null);
    setLastMove(null);
    setDone(false);
    setNote(null);
    setPromo(null);
    setStamp((value) => value + 1);
  }

  function openLesson(next: number) {
    const item = LESSONS[next];
    if (!item) return;
    setFree(false);
    setIndex(next);
    load(item.fen);
  }

  function openFree() {
    setFree(true);
    setDone(false);
    setNote("Đi cả hai bên. Bàn không có đối thủ — dùng để thử ý và quay lại nước vừa đi.");
    load(START);
  }

  function play(from: string, to: string, promotion?: "q" | "r" | "b" | "n") {
    const chess = chessRef.current;
    if (!free && !goalMet(lesson, from, to, promotion)) {
      playFx("illegal");
      setSelected(null);
      setPromo(null);
      setNote(lesson.hint);
      return;
    }
    let move;
    try {
      move = chess.move({ from: asSquare(from), to: asSquare(to), promotion });
    } catch {
      playFx("illegal");
      setNote("Nước đó không hợp lệ.");
      return;
    }
    if (move.san.includes("#")) playFx("check", move.piece);
    else if (move.isPromotion()) playFx("promote", move.promotion ?? move.piece);
    else if (move.isKingsideCastle() || move.isQueensideCastle()) playFx("castle", move.piece);
    else if (move.isCapture()) playFx("capture", move.piece);
    else if (chess.inCheck()) playFx("check", move.piece);
    else playFx("move", move.piece);
    setFen(chess.fen());
    setLastMove({ from: move.from, to: move.to });
    setSelected(null);
    setPromo(null);
    if (!free) {
      setDone(true);
      setNote(lesson.success);
    } else {
      setNote(chess.isGameOver() ? "Ván tập đã kết thúc. Xếp lại để đi tiếp." : null);
    }
  }

  function onSquare(square: string) {
    unlockAudio();
    const chess = chessRef.current;
    if (!square) {
      setSelected(null);
      return;
    }
    if ((!free && (lesson.readOnly || done)) || chess.isGameOver()) return;
    if (selected) {
      const moves = chess.moves({ square: asSquare(selected), verbose: true }).filter((move) => move.to === square);
      if (moves.length > 0) {
        if (moves.some((move) => move.promotion)) {
          setPromo({ from: selected, to: square });
          return;
        }
        play(selected, square);
        return;
      }
    }
    const piece = chess.get(asSquare(square));
    if (piece && piece.color === chess.turn()) {
      setSelected(square);
      playFx("select", piece.type);
    } else setSelected(null);
  }

  function undo() {
    const chess = chessRef.current;
    if (chess.history().length === 0) return;
    chess.undo();
    setFen(chess.fen());
    setSelected(null);
    setPromo(null);
    setLastMove(null);
    setDone(false);
    setNote(free ? null : null);
  }

  const chess = chessRef.current;
  const interactive = free ? !chess.isGameOver() : !lesson.readOnly && !done && !chess.isGameOver();
  const legal = useMemo(() => {
    if (!interactive || !selected) return [];
    return chessRef.current.moves({ square: asSquare(selected), verbose: true }).map((move) => ({
      to: move.to,
      capture: Boolean(move.captured),
    }));
  }, [interactive, selected, fen, stamp]);
  const checkSquare = chess.inCheck() ? kingSquare(chess, chess.turn()) : null;
  const turnLabel = chess.turn() === "w" ? "Lượt Trắng" : "Lượt Đen";

  return (
    <div className="grid h-dvh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 lg:col-span-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Celestial Crystal</p>
          <h1 className="text-xl">Tập chơi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn">
            Về sảnh
          </Link>
          <SoundButton />
        </div>
      </header>
      <div className="relative h-full min-h-0 min-w-0">
        <ClientBoard
          fen={fen}
          flipped={false}
          selected={selected}
          legal={legal}
          lastMove={lastMove}
          checkSquare={checkSquare}
          interactive={interactive}
          anim={null}
          onSquare={onSquare}
          onAnimDone={() => {}}
        />
        {promo && (
          <PromotionDialog
            color={chess.turn()}
            onChoose={(piece) => play(promo.from, promo.to, piece)}
          />
        )}
      </div>
      <aside className="panel m-3 flex max-h-[46dvh] flex-col overflow-y-auto p-4 lg:m-0 lg:max-h-none lg:rounded-none lg:border-y-0 lg:border-r-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LESSONS.map((item, i) => (
            <button key={item.id} type="button" className="chip shrink-0" data-on={!free && i === index} onClick={() => openLesson(i)}>
              {i + 1}. {item.title}
            </button>
          ))}
          <button type="button" className="chip shrink-0" data-on={free} onClick={openFree}>
            Tập tự do
          </button>
        </div>
        {free ? (
          <>
            <p className="mt-3 text-xs tracking-[0.16em] text-gold uppercase">{turnLabel}</p>
            <h2 className="mt-1 text-lg">Tập tự do</h2>
            <p className="mt-2 text-sm text-muted">
              Đi thay cả hai bên trên một bàn đủ quân. Dùng khi muốn thử nhập thành, phong cấp, hoặc một thế cờ vừa đọc.
            </p>
            <p className="mt-2 text-sm">{note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={undo}>
                Lùi một nước
              </button>
              <button type="button" className="btn" onClick={() => load(START)}>
                Xếp lại
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-xs tracking-[0.16em] text-gold uppercase">
              Bài {index + 1}/{LESSONS.length}
              {lesson.readOnly ? "" : ` · ${turnLabel}`}
            </p>
            <h2 className="mt-1 text-lg">{lesson.title}</h2>
            <p className="mt-2 text-sm">{lesson.lead}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
              {lesson.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {note && <p className={`mt-3 text-sm ${done ? "text-gold" : "text-fg"}`}>{note}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn" disabled={index === 0} onClick={() => openLesson(index - 1)}>
                Bài trước
              </button>
              {!lesson.readOnly && (
                <button type="button" className="btn" onClick={() => load(lesson.fen)}>
                  Làm lại
                </button>
              )}
              {(lesson.readOnly || done) && index < LESSONS.length - 1 && (
                <button type="button" className="btn btn-gold" onClick={() => openLesson(index + 1)}>
                  Bài tiếp
                </button>
              )}
              {(lesson.readOnly || done) && index === LESSONS.length - 1 && (
                <button type="button" className="btn btn-gold" onClick={openFree}>
                  Tập tự do
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
