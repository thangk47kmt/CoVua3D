import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DEFAULT_POSITION } from "chess.js";
import { ClientBoard } from "@/components/chess/ClientBoard";
import { SoundButton } from "@/components/chess/MatchChrome";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { ThemePicker } from "@/components/chess/ThemePicker";
import { unlockAudio } from "@/game/audio";
import { LEVELS } from "@/game/levels";
import { readSave } from "@/game/save";
import { levelBlurb, levelName, useT } from "@/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { t } = useT();
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
            <p className="max-w-md text-sm text-muted">{t("tagline")}</p>
          </div>
          <div className="flex gap-2">
            <LanguageButton />
            <Link to="/hall" className="btn">
              {t("hall")}
            </Link>
            <SoundButton />
          </div>
        </header>
        <div className="flex-1" />
        <section className="pointer-events-auto panel mx-3 mb-3 max-h-[58dvh] overflow-y-auto p-4 sm:mx-auto sm:w-full sm:max-w-3xl lg:absolute lg:top-24 lg:right-4 lg:bottom-4 lg:mx-0 lg:mb-0 lg:w-80 lg:max-w-none">
          <ThemePicker />
          <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">{t("difficulty")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {LEVELS.map((item) => (
              <button key={item.id} type="button" className="chip shrink-0" data-on={level === item.id} onClick={() => setLevel(item.id)}>
                {levelName(t, item.id)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{levelBlurb(t, chosen.id)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["w", t("playWhite")],
                ["b", t("playBlack")],
                ["r", t("randomColor")],
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
              {t("startMatch")}
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
                {t("resumeMatch")}
              </button>
            )}
            <Link to="/learn" className="btn" onClick={() => unlockAudio()}>
              {t("practice")}
            </Link>
            <Link to="/hall" className="btn" onClick={() => unlockAudio()}>
              {t("challengeHall")}
            </Link>
          </div>
          <details className="mt-3 text-sm text-muted">
            <summary className="cursor-pointer text-fg">{t("rulesSummary")}</summary>
            <p className="mt-2">{t("rulesP1")}</p>
            <p className="mt-2">{t("rulesP2")}</p>
          </details>
        </section>
      </div>
    </main>
  );
}
