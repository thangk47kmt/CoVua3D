import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Flag, Handshake, RotateCw, Undo2, Volume2, VolumeX } from "lucide-react";
import {
  hydrateMute,
  isMuted,
  musicVolume,
  playFx,
  setMusicVolume,
  setMuted,
  setSfxVolume,
  sfxVolume,
  subscribeMute,
  unlockAudio,
} from "@/game/audio";
import { capturedSets, moveRows } from "@/game/notation";
import { srcForGlyph, srcForPiece, usePieceSet } from "./pieceArt";
import { ThemePicker } from "./ThemePicker";

export function SoundButton() {
  const muted = useSyncExternalStore(subscribeMute, isMuted, () => false);
  const music = useSyncExternalStore(subscribeMute, musicVolume, () => 1);
  const sfx = useSyncExternalStore(subscribeMute, sfxVolume, () => 1);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    hydrateMute();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const silent = muted || (music <= 0.001 && sfx <= 0.001);
  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        className="btn btn-ghost min-w-11 px-3"
        aria-expanded={open}
        aria-label="Chỉnh âm lượng"
        onClick={() => {
          unlockAudio();
          setOpen((value) => !value);
        }}
      >
        {silent ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-56 rounded-xl border border-line bg-[#100c18]/95 p-3 text-left shadow-lg backdrop-blur">
          <label className="block text-xs tracking-[0.14em] text-muted uppercase">
            Nhạc nền
            <input
              className="vol-slider mt-1"
              type="range"
              min={0}
              max={100}
              value={Math.round(music * 100)}
              aria-valuetext={`${Math.round(music * 100)}%`}
              onChange={(event) => {
                unlockAudio();
                if (muted) setMuted(false);
                setMusicVolume(Number(event.target.value) / 100);
              }}
            />
          </label>
          <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
            Hiệu ứng
            <input
              className="vol-slider mt-1"
              type="range"
              min={0}
              max={100}
              value={Math.round(sfx * 100)}
              aria-valuetext={`${Math.round(sfx * 100)}%`}
              onChange={(event) => {
                unlockAudio();
                if (muted) setMuted(false);
                setSfxVolume(Number(event.target.value) / 100);
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost mt-3 w-full"
            onClick={() => {
              unlockAudio();
              setMuted(!muted);
            }}
          >
            {muted ? "Bật tiếng" : "Tắt hết"}
          </button>
        </div>
      )}
    </div>
  );
}

export function MatchChrome({
  kicker,
  status,
  whiteName,
  blackName,
  turn,
  fen,
  sans,
  thinking,
  onFlip,
  onUndo,
  onResign,
  onHint,
  onPlayNow,
  onOfferDraw,
  drawHint,
  onAcceptDraw,
  onDeclineDraw,
  error,
  onPickSan,
  activePly,
  children,
}: {
  kicker: string;
  status: string;
  whiteName: string;
  blackName: string;
  turn: "w" | "b" | null;
  fen: string;
  sans: string[];
  thinking: boolean;
  onFlip: () => void;
  onUndo?: () => void;
  onResign?: () => void;
  onHint?: () => void;
  onPlayNow?: () => void;
  onOfferDraw?: () => void;
  drawHint?: string | null;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  error?: string;
  onPickSan?: (ply: number) => void;
  activePly?: number | null;
  children?: ReactNode;
}) {
  const caps = capturedSets(fen);
  const rows = moveRows(sans);
  const diff =
    caps.diff === 0 ? "" : caps.diff > 0 ? `+${caps.diff}` : `${caps.diff}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setOpen(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  const label = thinking ? "Tinh tú đang nghĩ…" : status;
  return (
    <aside className="panel flex min-h-0 max-h-[46dvh] flex-col gap-3 overflow-y-auto p-3 lg:max-h-none">
      <button
        type="button"
        className="btn w-full"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Thu thiết lập" : `Thiết lập · ${label}`}
      </button>
      <div className="max-h-28 min-h-0 overflow-y-auto rounded-lg border border-line">
        {rows.length === 0 ? (
          <p className="p-3 text-sm text-muted">Chưa có nước đi.</p>
        ) : (
          <ol className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.n} className="grid grid-cols-[2.2rem_1fr_1fr] items-center text-sm tabular-nums">
                <span className="px-2 text-muted">{row.n}</span>
                <SanButton san={row.w} ply={row.n * 2 - 1} active={activePly === row.n * 2 - 1} onPick={onPickSan} />
                <SanButton san={row.b} ply={row.n * 2} active={activePly === row.n * 2} onPick={onPickSan} />
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className={`grid gap-2 ${onPlayNow ? "grid-cols-3" : "grid-cols-2"}`}>
        {onHint && (
          <button type="button" className="btn" onClick={onHint} disabled={thinking}>
            Gợi ý
          </button>
        )}
        {onUndo && (
          <button type="button" className="btn" onClick={onUndo}>
            <Undo2 size={16} /> Đi lại
          </button>
        )}
        {onPlayNow && (
          <button type="button" className={`btn btn-gold ${thinking ? "" : "invisible"}`} disabled={!thinking} onClick={onPlayNow}>
            Đi ngay
          </button>
        )}
      </div>
      {open && (
        <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-gold uppercase">{kicker}</p>
          <p className="mt-1 text-lg text-fg">{label}</p>
        </div>
        <Link to="/" className="btn btn-ghost px-3" aria-label="Về sảnh chính">
          <ArrowLeft size={18} />
        </Link>
      </div>
      <ThemePicker />
      <PlayerLine name={blackName} side="Đen" active={turn === "b"} caps={caps.byBlack} score={caps.diff < 0 ? `+${-caps.diff}` : ""} />
      <PlayerLine name={whiteName} side="Trắng" active={turn === "w"} caps={caps.byWhite} score={diff && caps.diff > 0 ? diff : ""} />
      {error && <p className="text-sm text-danger">{error}</p>}
      {drawHint && (
        <div className="rounded-lg border border-line p-3">
          <p className="text-sm">{drawHint}</p>
          {onAcceptDraw && onDeclineDraw && (
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn btn-gold flex-1" onClick={onAcceptDraw}>
                Nhận hòa
              </button>
              <button type="button" className="btn flex-1" onClick={onDeclineDraw}>
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}
      {children}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn" onClick={onFlip}>
          <RotateCw size={16} /> Xoay bàn
        </button>
        {onOfferDraw && (
          <button type="button" className="btn" onClick={onOfferDraw}>
            <Handshake size={16} /> Xin hòa
          </button>
        )}
        {onResign && (
          <button type="button" className="btn" onClick={onResign}>
            <Flag size={16} /> Xin thua
          </button>
        )}
      </div>
        </>
      )}
    </aside>
  );
}

function PlayerLine({
  name,
  side,
  active,
  caps,
  score,
}: {
  name: string;
  side: string;
  active: boolean;
  caps: string;
  score: string;
}) {
  const pieces = usePieceSet();
  return (
    <div className={`rounded-lg border px-3 py-2 ${active ? "border-gold" : "border-line"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate">
          <span className="text-muted">{side} · </span>
          {name}
        </p>
        {score && <span className="text-sm text-gold tabular-nums">{score}</span>}
      </div>
      <p className="flex min-h-6 flex-wrap items-end gap-px">
        {[...caps].map((glyph, index) => {
          const src = srcForGlyph(glyph, pieces);
          return src ? (
            <img key={`${glyph}-${index}`} src={src} alt="" className="h-7 w-auto" draggable={false} />
          ) : (
            <span key={`${glyph}-${index}`}>{glyph}</span>
          );
        })}
      </p>
    </div>
  );
}

function SanButton({
  san,
  ply,
  active,
  onPick,
}: {
  san?: string;
  ply: number;
  active: boolean;
  onPick?: (ply: number) => void;
}) {
  if (!san) return <span />;
  if (!onPick) return <span className="px-2 py-2">{san}</span>;
  return (
    <button
      type="button"
      className={`px-2 py-2 text-left ${active ? "text-gold" : "text-fg"}`}
      onClick={() => onPick(ply)}
    >
      {san}
    </button>
  );
}

export function PromotionDialog({
  color,
  onChoose,
}: {
  color: "w" | "b";
  onChoose: (piece: "q" | "r" | "b" | "n") => void;
}) {
  const pieces = usePieceSet();
  const choices = [
    ["q", "Hậu"],
    ["r", "Xe"],
    ["b", "Tượng"],
    ["n", "Mã"],
  ] as const;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-bg/70 p-4">
      <div className="panel w-full max-w-sm p-4">
        <h2 className="text-xl">Phong cấp</h2>
        <p className="mt-1 text-sm text-muted">Tốt đã tới hàng cuối. Chọn quân mới.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {choices.map(([piece, label]) => (
            <button key={piece} type="button" className="btn" onClick={() => { unlockAudio(); playFx("promote", piece); onChoose(piece); }}>
              <img src={srcForPiece(color, piece, pieces)} alt="" className="h-10 w-auto" draggable={false} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MoveHelper({
  buttons,
}: {
  buttons: { id: string; label: string; onClick: () => void }[];
}) {
  if (buttons.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs tracking-[0.14em] text-muted uppercase">Nước đi</p>
      <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {buttons.map((button) => (
          <button key={button.id} type="button" className="chip" onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
