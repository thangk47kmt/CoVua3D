import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BotMatch } from "@/components/game/BotMatch";
import { clearSave, readSave } from "@/game/save";
import { useT } from "@/i18n";

type PlaySearch = { level: number; color: "w" | "b" | "r"; resume: boolean };

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): PlaySearch => {
    const level = Number(search.level);
    const color = search.color === "b" || search.color === "r" ? search.color : "w";
    return {
      level: level >= 1 && level <= 5 ? level : 3,
      color,
      resume: search.resume === true || search.resume === "true",
    };
  },
  component: PlayPage,
});

function PlayPage() {
  const search = Route.useSearch();
  const { t } = useT();
  const [setup, setSetup] = useState<null | { level: number; color: "w" | "b"; sans: string[]; nonce: number }>(null);

  useEffect(() => {
    if (search.resume) {
      const saved = readSave();
      if (saved) {
        setSetup({ level: saved.level, color: saved.playerColor, sans: saved.sans, nonce: 1 });
        return;
      }
    }
    const color = search.color === "r" ? (Math.random() < 0.5 ? "w" : "b") : search.color;
    setSetup({ level: search.level, color, sans: [], nonce: 1 });
  }, [search.color, search.level, search.resume]);

  if (!setup) {
    return <div className="grid h-dvh place-items-center text-muted">{t("settingUp")}</div>;
  }

  return (
    <BotMatch
      key={`${setup.nonce}-${setup.level}-${setup.color}`}
      levelId={setup.level}
      playerColor={setup.color}
      initialSans={setup.sans}
      onRestart={() => {
        clearSave();
        const color = search.color === "r" ? (Math.random() < 0.5 ? "w" : "b") : search.color === "b" ? "b" : "w";
        setSetup((current) => ({
          level: search.level,
          color,
          sans: [],
          nonce: (current?.nonce ?? 1) + 1,
        }));
      }}
    />
  );
}
