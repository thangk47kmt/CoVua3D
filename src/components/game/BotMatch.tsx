import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ClientBoard } from "@/components/chess/ClientBoard";
import { MatchChrome, MoveHelper, PromotionDialog, SoundButton } from "@/components/chess/MatchChrome";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { playFx, unlockAudio } from "@/game/audio";
import { search, type EngineMove } from "@/game/engine";
import { levelById } from "@/game/levels";
import { animFromMove, type BoardAnim } from "@/game/notation";
import { asSquare, kingSquare, outcome } from "@/game/rules";
import { writeSave } from "@/game/save";
import { formatStatus, getLang, levelName, pieceLabel, translate, useT } from "@/i18n";

type Phase = "idle" | "animating" | "promote" | "over";

export function BotMatch({
  levelId,
  playerColor,
  initialSans,
  onRestart,
}: {
  levelId: number;
  playerColor: "w" | "b";
  initialSans: string[];
  onRestart: () => void;
}) {
  const level = levelById(levelId);
  const { t } = useT();
  const levelTitle = levelName(t, level.id);
  const chessRef = useRef<Chess | null>(null);
  if (!chessRef.current) {
    const chess = new Chess();
    for (const san of initialSans) {
      try {
        chess.move(san);
      } catch {
        break;
      }
    }
    chessRef.current = chess;
  }
  const boot = chessRef.current;
  const [shown, setShown] = useState(() => boot.fen());
  const [phase, setPhase] = useState<Phase>(() => (boot.isGameOver() ? "over" : "idle"));
  const [selected, setSelected] = useState<string | null>(null);
  const [anim, setAnim] = useState<BoardAnim | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(playerColor === "b");
  const [sans, setSans] = useState<string[]>(() => boot.history());
  const [confirmResign, setConfirmResign] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const req = useRef(0);
  const hintId = useRef(0);
  const animId = useRef(1);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const endedSound = useRef(false);

  const settled = useRef(0);
  const applyRef = useRef<(from: string, to: string, promotion?: string) => void>(() => {});
  applyRef.current = (from, to, promotion) => {
    const chess = chessRef.current;
    if (!chess || chess.isGameOver()) return;
    let move;
    try {
      move = chess.move({ from: asSquare(from), to: asSquare(to), promotion });
    } catch {
      playFx("illegal");
      setWaiting(false);
      setPhase("idle");
      return;
    }
    if (move.san.includes("#") || move.san.endsWith("+")) playFx("check", move.piece);
    else if (move.isPromotion()) playFx("promote", move.promotion ?? move.piece);
    else if (move.isKingsideCastle() || move.isQueensideCastle()) playFx("castle", move.piece);
    else if (move.isCapture()) playFx("capture", move.piece);
    else playFx("move", move.piece);
    const token = ++animId.current;
    settled.current = 0;
    setWaiting(false);
    setAnim(animFromMove(move, token));
    setLastMove({ from: move.from, to: move.to });
    setSelected(null);
    setHint(null);
    setPromo(null);
    setSans(chess.history());
    setPhase("animating");
    setShown(move.before);
    writeSave({ version: 1, level: level.id, playerColor, sans: chess.history() });
  };

  const askRef = useRef<() => void>(() => {});
  askRef.current = () => {
    const chess = chessRef.current;
    const worker = workerRef.current;
    if (!chess || !worker || chess.isGameOver() || chess.turn() === playerColor) return;
    const id = ++req.current;
    const fen = chess.fen();
    setWaiting(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (req.current !== id) return;
      req.current += 1;
      try {
        const move = search(fen, 40, level.noise, 1);
        if (move) applyRef.current(move.from, move.to, move.promotion);
        else setWaiting(false);
      } catch {
        setWaiting(false);
      }
    }, level.movetime + 1800);
    worker.postMessage({
      id,
      fen,
      movetime: level.movetime,
      noise: level.noise,
      depthCap: level.depthCap,
    });
  };

  useEffect(() => {
    const worker = new Worker(new URL("../../game/engine.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    const onMessage = (event: MessageEvent<{ id: number; move: EngineMove | null }>) => {
      if (!event.data) return;
      if (event.data.id < 0) {
        if (event.data.id !== -hintId.current) return;
        const move = event.data.move;
        if (!move) {
          setHint(translate(getLang(), "hintNone"));
          return;
        }
        setHint(translate(getLang(), "hintSan", { san: move.san }));
        setSelected(move.from);
        return;
      }
      if (event.data.id !== req.current) return;
      req.current += 1;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      const move = event.data.move;
      if (move) applyRef.current(move.from, move.to, move.promotion);
      else setWaiting(false);
    };
    worker.addEventListener("message", onMessage);
    const boot = window.setTimeout(() => askRef.current(), 60);
    return () => {
      window.clearTimeout(boot);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      workerRef.current = null;
      req.current += 1;
    };
  }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const finishRef = useRef<() => void>(() => {});
  finishRef.current = () => {
    if (phaseRef.current !== "animating") return;
    if (settled.current === animId.current) return;
    settled.current = animId.current;
    phaseRef.current = "idle";
    const chess = chessRef.current;
    if (!chess) return;
    const end = outcome(chess);
    setAnim(null);
    setShown(chess.fen());
    setSans(chess.history());
    if (end.status === "finished") {
      setPhase("over");
      setWaiting(false);
      if (!endedSound.current) {
        endedSound.current = true;
        playFx("end");
      }
      return;
    }
    setPhase("idle");
    if (chess.turn() !== playerColor) askRef.current();
  };

  function onAnimDone() {
    finishRef.current();
  }

  useEffect(() => {
    if (phase !== "animating") return;
    const timer = window.setTimeout(() => finishRef.current(), 1400);
    return () => window.clearTimeout(timer);
  }, [phase, anim?.id]);

  const live = chessRef.current;
  const shownChess = useMemo(() => new Chess(shown), [shown]);
  const viewChess = phase === "animating" ? shownChess : live;
  const liveReport = outcome(live);
  const checkSquare =
    phase === "animating" || !liveReport.inCheck ? null : kingSquare(viewChess, viewChess.turn());
  const myTurn = phase === "idle" && !manual && live.turn() === playerColor && !live.isGameOver();

  function onSquare(square: string) {
    unlockAudio();
    if (!square) {
      setSelected(null);
      return;
    }
    const chess = chessRef.current;
    if (!chess || !myTurn) return;
    if (selected) {
      const moves = chess.moves({ square: asSquare(selected), verbose: true }).filter((move) => move.to === square);
      if (moves.length > 0) {
        if (moves.some((move) => move.promotion)) {
          setPromo({ from: selected, to: square });
          setPhase("promote");
          return;
        }
        applyRef.current(selected, square);
        return;
      }
    }
    const piece = chess.get(asSquare(square));
    if (piece && piece.color === playerColor) {
      setSelected(square);
      playFx("select", piece.type);
    } else setSelected(null);
  }

  function playNow() {
    const chess = chessRef.current;
    const worker = workerRef.current;
    if (!chess || !worker || !waiting) return;
    const id = ++req.current;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    worker.postMessage({ id, fen: chess.fen(), movetime: 70, noise: level.noise, depthCap: 1 });
  }

  function askHint() {
    const chess = chessRef.current;
    const worker = workerRef.current;
    if (!chess || !worker || phase !== "idle" || chess.turn() !== playerColor || chess.isGameOver()) return;
    const id = ++hintId.current;
    setHint(translate(getLang(), "hintWait"));
    worker.postMessage({ id: -id, fen: chess.fen(), movetime: 180, noise: 0, depthCap: 2 });
  }

  function undo() {
    const chess = chessRef.current;
    if (!chess || phase === "animating" || phase === "promote") return;
    if (chess.history().length === 0) return;
    req.current += 1;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    do {
      chess.undo();
    } while (chess.history().length > 0 && chess.turn() !== playerColor);
    endedSound.current = false;
    setManual(null);
    setWaiting(false);
    setSelected(null);
    setAnim(null);
    setPromo(null);
    setLastMove(null);
    setShown(chess.fen());
    setSans(chess.history());
    writeSave({ version: 1, level: level.id, playerColor, sans: chess.history() });
    setPhase("idle");
  }

  const legal = useMemo(() => {
    if (!selected || !myTurn) return [];
    const map = new Map<string, { to: string; capture: boolean }>();
    for (const move of live.moves({ square: asSquare(selected), verbose: true })) {
      map.set(move.to, { to: move.to, capture: move.isCapture() });
    }
    return [...map.values()];
  }, [selected, myTurn, live, sans, phase]);

  const helper = !myTurn
    ? []
    : !selected
      ? uniqueOrigins(live, playerColor).map((move) => ({
          id: move.from,
          label: `${pieceLabel(t, move.piece)} ${move.from}`,
          onClick: () => onSquare(move.from),
        }))
      : legal.map((dot) => ({
          id: dot.to,
          label: dot.capture ? t("captureSq", { sq: dot.to }) : dot.to,
          onClick: () => onSquare(dot.to),
        }));

  const status = manual ?? (waiting ? t("thinking") : (hint ?? formatStatus(t, liveReport, live.turn())));

  return (
    <div className="grid h-dvh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 lg:col-span-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Celestial Crystal</p>
          <h1 className="text-xl">{levelTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={onRestart}>
            {t("newGame")}
          </button>
          <LanguageButton />
          <SoundButton />
        </div>
      </header>
      <div className="relative h-full min-h-0 min-w-0">
        <ClientBoard
          fen={shown}
          flipped={flipped}
          selected={selected}
          legal={legal}
          lastMove={lastMove}
          checkSquare={checkSquare}
          interactive={myTurn}
          anim={anim}
          onSquare={onSquare}
          onAnimDone={onAnimDone}
        />
        {phase === "promote" && promo && (
          <PromotionDialog color={playerColor} onChoose={(piece) => applyRef.current(promo.from, promo.to, piece)} />
        )}
        {confirmResign && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-bg/70 p-4">
            <div className="panel w-full max-w-sm p-4">
              <h2 className="text-xl">{t("resignTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("resignBot", { name: levelTitle })}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn flex-1"
                  onClick={() => {
                    req.current += 1;
                    setConfirmResign(false);
                    setWaiting(false);
                    setManual(playerColor === "w" ? t("resignedWhite") : t("resignedBlack"));
                    setPhase("over");
                    playFx("end");
                  }}
                >
                  {t("resignConfirm")}
                </button>
                <button type="button" className="btn btn-gold flex-1" onClick={() => setConfirmResign(false)}>
                  {t("keepPlaying")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <MatchChrome
        kicker={playerColor === "w" ? t("youHoldWhite") : t("youHoldBlack")}
        status={status}
        whiteName={playerColor === "w" ? t("you") : levelTitle}
        blackName={playerColor === "b" ? t("you") : levelTitle}
        turn={manual || live.isGameOver() ? null : live.turn()}
        fen={shown}
        sans={sans}
        thinking={waiting}
        onFlip={() => setFlipped((value) => !value)}
        onUndo={undo}
        onHint={phase === "over" ? undefined : askHint}
        onPlayNow={playNow}
        onResign={phase === "over" ? undefined : () => setConfirmResign(true)}
      >
        <MoveHelper buttons={helper} />
      </MatchChrome>
    </div>
  );
}

function uniqueOrigins(chess: Chess, color: "w" | "b") {
  const seen = new Set<string>();
  return chess.moves({ verbose: true }).filter((move) => {
    if (move.color !== color || seen.has(move.from)) return false;
    seen.add(move.from);
    return true;
  });
}
