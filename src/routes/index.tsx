import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DEFAULT_POSITION } from "chess.js";
import { ClientBoard } from "@/components/chess/ClientBoard";
import { SoundButton } from "@/components/chess/MatchChrome";
import { ThemePicker } from "@/components/chess/ThemePicker";
import { unlockAudio } from "@/game/audio";
import { LEVELS } from "@/game/levels";
import { readSave } from "@/game/save";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(3);
  const [color, setColor] = useState<"w" | "b" | "r">("w");
  const [saved, setSaved] = useState(false);
  const chosen = LEVELS.find((item) => item.id === level) ?? LEVELS[2];

  useEffect(() => {
    const data = readSave();
    setSaved(Boolean(data && data.sans.length > 0));
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden">
      <div className="absolute inset-0">
        <ClientBoard
          fen={DEFAULT_POSITION}
          flipped={false}
          selected={null}
          legal={[]}
          lastMove={null}
          checkSquare={null}
          interactive={false}
          anim={null}
          onSquare={() => {}}
          onAnimDone={() => {}}
          autoRotate
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <header className="pointer-events-auto flex items-start justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-gold uppercase">Chess set</p>
            <h1 className="text-4xl text-fg sm:text-5xl">Celestial Crystal</h1>
            <p className="max-w-md text-sm text-muted">Vương quốc của những vì sao, mãi trong tay bạn.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/hall" className="btn">
              Sảnh
            </Link>
            <SoundButton />
          </div>
        </header>
        <div className="flex-1" />
        <section className="pointer-events-auto panel mx-3 mb-3 max-h-[58dvh] overflow-y-auto p-4 sm:mx-auto sm:w-full sm:max-w-3xl lg:absolute lg:top-24 lg:right-4 lg:bottom-4 lg:mx-0 lg:mb-0 lg:w-80 lg:max-w-none">
          <ThemePicker />
          <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">Độ khó của tinh tú</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {LEVELS.map((item) => (
              <button key={item.id} type="button" className="chip shrink-0" data-on={level === item.id} onClick={() => setLevel(item.id)}>
                {item.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{chosen.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["w", "Cầm Trắng"],
                ["b", "Cầm Đen"],
                ["r", "Ngẫu nhiên"],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" className="chip" data-on={color === value} onClick={() => setColor(value)}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                unlockAudio();
                void navigate({ to: "/play", search: { level, color, resume: false } });
              }}
            >
              Bắt đầu ván đấu
            </button>
            {saved && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  unlockAudio();
                  void navigate({ to: "/play", search: { level, color, resume: true } });
                }}
              >
                Tiếp tục ván dở
              </button>
            )}
            <Link to="/learn" className="btn" onClick={() => unlockAudio()}>
              Tập chơi
            </Link>
            <Link to="/hall" className="btn" onClick={() => unlockAudio()}>
              Vào sảnh thách đấu
            </Link>
          </div>
          <details className="mt-3 text-sm text-muted">
            <summary className="cursor-pointer text-fg">Luật chơi và cách điều khiển</summary>
            <p className="mt-2">
              Đúng luật cờ vua: chiếu, chiếu hết, pat, nhập thành, bắt tốt qua đường, phong cấp, hòa khi lặp thế cờ,
              luật 50 nước và khi không đủ lực chiếu hết. Pat là hòa, không phải thắng.
            </p>
            <p className="mt-2">
              Chạm một quân, rồi chạm ô sáng để đi. Kéo để xoay. Nút + và cuộn chuột phóng vào ô đang chọn,
              hoặc vào chỗ con trỏ nếu chưa chọn quân. − thu ra, Góc trả về toàn bàn.
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}
