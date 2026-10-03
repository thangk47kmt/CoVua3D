import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { ClientBoard } from "@/components/chess/ClientBoard";
import { MatchChrome, MoveHelper, PromotionDialog, SoundButton } from "@/components/chess/MatchChrome";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { playFx, unlockAudio } from "@/game/audio";
import { bridgeAnim, type BoardAnim } from "@/game/notation";
import { asSquare, kingSquare, outcome } from "@/game/rules";
import { answerDraw, getGame, offerDraw, playMove, resignGame, type GameView } from "@/lib/hall";
import { formatStatus, getLang, pieceLabel, translate, useT } from "@/i18n";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function OnlineMatch({ id }: { id: string }) {
  const { t } = useT();
  const [view, setView] = useState<GameView | null>(null);
  const [missing, setMissing] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [anim, setAnim] = useState<BoardAnim | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const oriented = useRef(false);
  const animLock = useRef(false);
  const animId = useRef(1);

  async function pull() {
    try {
      const game = await getGame({ data: id });
      if (!game) setMissing(true);
      else {
        setMissing(false);
        setView(game);
      }
    } catch {
      setError(translate(getLang(), "matchLost"));
    }
  }

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop) return;
      await pull();
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 1200);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
    // pull identity changes each render; the interval closes over the latest via void pull in a ref-free way
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!view || oriented.current) return;
    if (view.youAre === "b") setFlipped(true);
    oriented.current = true;
  }, [view]);

  useEffect(() => {
    if (!view || scrub !== null || animLock.current) return;
    if (shown === null) {
      setShown(view.fen);
      return;
    }
    if (shown === view.fen) return;
    const next = bridgeAnim(shown, view.fen, animId.current + 1);
    if (!next) {
      setShown(view.fen);
      return;
    }
    animId.current = next.id;
    animLock.current = true;
    soundForSan(next);
    setAnim(next);
  }, [view, shown, scrub]);

  function onAnimDone() {
    animLock.current = false;
    setAnim(null);
    setShown((current) => view?.fen ?? current);
  }

  const fen = shown ?? view?.fen ?? START;
  const turn = fen.split(" ")[1] === "b" ? "b" : "w";
  const myTurn = Boolean(
    view &&
      view.status === "playing" &&
      view.youAre === turn &&
      shown === view.fen &&
      scrub === null &&
      !anim &&
      !busy &&
      !promo,
  );

  async function commit(from: string, to: string, promotion?: string) {
    unlockAudio();
    const preview = new Chess(fen);
    let move;
    try {
      move = preview.move({ from: asSquare(from), to: asSquare(to), promotion });
    } catch {
      playFx("illegal");
      setError(translate(getLang(), "illegalMove"));
      return;
    }
    setBusy(true);
    setError("");
    setSelected(null);
    setPromo(null);
    const result = await playMove({ data: { gameId: id, from, to, promotion } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      playFx("illegal");
      return;
    }
    await pull();
  }

  function onSquare(square: string) {
    if (!square) {
      setSelected(null);
      return;
    }
    if (!myTurn || !view) return;
    const chess = new Chess(fen);
    if (selected) {
      const moves = chess.moves({ square: asSquare(selected), verbose: true }).filter((move) => move.to === square);
      if (moves.length > 0) {
        if (moves.some((move) => move.promotion)) {
          setPromo({ from: selected, to: square });
          return;
        }
        void commit(selected, square);
        return;
      }
    }
    const piece = chess.get(asSquare(square));
    if (piece && piece.color === view.youAre) {
      setSelected(square);
      playFx("select", piece.type);
    } else setSelected(null);
  }

  const legal = useMemo(() => {
    if (!myTurn || !selected) return [];
    const chess = new Chess(fen);
    const map = new Map<string, { to: string; capture: boolean }>();
    for (const move of chess.moves({ square: asSquare(selected), verbose: true })) {
      map.set(move.to, { to: move.to, capture: move.isCapture() });
    }
    return [...map.values()];
  }, [myTurn, selected, fen]);

  const helper = !myTurn
    ? []
    : !selected
      ? origins(fen, turn).map((move) => ({
          id: move.from,
          label: `${pieceLabel(t, move.piece)} ${move.from}`,
          onClick: () => onSquare(move.from),
        }))
      : legal.map((dot) => ({
          id: dot.to,
          label: dot.capture ? t("captureSq", { sq: dot.to }) : dot.to,
          onClick: () => onSquare(dot.to),
        }));

  const sans = view?.moves.map((move) => move.san) ?? [];
  const last = useMemo(() => lastMove(sans), [sans.join("|")]);
  const boardChess = useMemo(() => new Chess(fen), [fen]);
  const report = outcome(boardChess);
  const checkSquare = report.inCheck ? kingSquare(boardChess, boardChess.turn()) : null;
  const drawIncoming = Boolean(view?.drawOffer && view.youAre !== "spectator" && view.drawOffer !== (view.youAre === "w" ? view.whiteId : view.blackId));
  const drawOutgoing = Boolean(view?.drawOffer && view.youAre !== "spectator" && view.drawOffer === (view.youAre === "w" ? view.whiteId : view.blackId));

  if (!view && !missing) {
    return <div className="grid h-dvh place-items-center text-muted">{t("openingMatch")}</div>;
  }
  if (missing || !view) {
    return (
      <div className="grid h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl">{t("gameMissing")}</h1>
          <Link to="/hall" className="btn btn-gold mt-4">
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const status =
    view.status === "finished"
      ? finishedText(view, t)
      : view.youAre === "spectator"
        ? t("watchLine", { status: formatStatus(t, report, boardChess.turn()) })
        : myTurn
          ? t("yourTurn")
          : formatStatus(t, report, boardChess.turn());

  return (
    <div className="grid h-dvh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 lg:col-span-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">
            {view.youAre === "spectator" ? t("watching") : t("challenge")}
          </p>
          <h1 className="text-xl">
            {view.whiteName} <span className="text-muted">/</span> {view.blackName}
          </h1>
        </div>
        <LanguageButton />
        <SoundButton />
      </header>
      <div className="relative h-full min-h-0 min-w-0">
        <ClientBoard
          fen={fen}
          flipped={flipped}
          selected={selected}
          legal={scrub === null ? legal : []}
          lastMove={scrub === null ? last : null}
          checkSquare={checkSquare}
          interactive={myTurn}
          anim={anim}
          onSquare={onSquare}
          onAnimDone={onAnimDone}
        />
        {promo && view.youAre !== "spectator" && (
          <PromotionDialog color={view.youAre} onChoose={(piece) => void commit(promo.from, promo.to, piece)} />
        )}
        {confirmResign && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-bg/70 p-4">
            <div className="panel w-full max-w-sm p-4">
              <h2 className="text-xl">{t("resignOnline")}</h2>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn flex-1"
                  onClick={() => {
                    setConfirmResign(false);
                    void resignGame({ data: id }).then(() => pull());
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
        kicker={view.youAre === "w" ? t("youHoldWhite") : view.youAre === "b" ? t("youHoldBlack") : t("spectator")}
        status={status}
        whiteName={view.whiteName}
        blackName={view.blackName}
        turn={view.status === "playing" ? turn : null}
        fen={fen}
        sans={sans}
        thinking={busy}
        onFlip={() => setFlipped((value) => !value)}
        onResign={view.youAre !== "spectator" && view.status === "playing" ? () => setConfirmResign(true) : undefined}
        onOfferDraw={view.youAre !== "spectator" && view.status === "playing" && !view.drawOffer ? () => void offerDraw({ data: id }).then(() => pull()) : undefined}
        drawHint={
          drawIncoming ? t("drawAsk") : drawOutgoing ? t("drawSent") : scrub !== null ? t("reviewing") : null
        }
        onAcceptDraw={drawIncoming ? () => void answerDraw({ data: { gameId: id, accept: true } }).then(() => pull()) : undefined}
        onDeclineDraw={drawIncoming ? () => void answerDraw({ data: { gameId: id, accept: false } }).then(() => pull()) : undefined}
        error={error}
        activePly={scrub}
        onPickSan={(ply) => {
          const move = view.moves.find((item) => item.ply === ply);
          if (!move) return;
          animLock.current = false;
          setAnim(null);
          setScrub(ply);
          setShown(move.fen);
          setSelected(null);
        }}
      >
        {scrub !== null && (
          <button
            type="button"
            className="btn btn-gold w-full"
            onClick={() => {
              setScrub(null);
              setShown(view.fen);
            }}
          >
            {t("backLive")}
          </button>
        )}
        <MoveHelper buttons={helper} />
      </MatchChrome>
    </div>
  );
}

function origins(fen: string, color: "w" | "b") {
  const chess = new Chess(fen);
  const seen = new Set<string>();
  return chess.moves({ verbose: true }).filter((move) => {
    if (move.color !== color || seen.has(move.from)) return false;
    seen.add(move.from);
    return true;
  });
}

function lastMove(sans: string[]): { from: string; to: string } | null {
  const chess = new Chess();
  let last: { from: string; to: string } | null = null;
  for (const san of sans) {
    try {
      const move = chess.move(san);
      last = { from: move.from, to: move.to };
    } catch {
      break;
    }
  }
  return last;
}

function soundForSan(anim: BoardAnim) {
  if (anim.rookFrom) playFx("castle", anim.piece);
  else if (anim.hide.length > 1) playFx("capture", anim.piece);
  else playFx("move", anim.piece);
}

function finishedText(view: GameView, t: (key: "blackResigned" | "whiteResigned" | "mateWhite" | "mateBlack" | "drawWord" | "gameOver") => string): string {
  if (view.reason === "resign") {
    return view.result === "1-0" ? t("blackResigned") : t("whiteResigned");
  }
  if (view.reason === "checkmate") return view.result === "1-0" ? t("mateWhite") : t("mateBlack");
  if (view.reason === "draw" || view.result === "1/2-1/2") return t("drawWord");
  return t("gameOver");
}
