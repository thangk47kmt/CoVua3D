import { useSyncExternalStore } from "react";
import type { Outcome } from "@/game/rules";
import type { Lesson } from "@/game/lessons";
import { UI, type Lang, type UiKey } from "./messages";
import { localizeLesson } from "./lessons";

export const LANGS = [
  { id: "vi", name: "Tiếng Việt", short: "VI" },
  { id: "en", name: "English", short: "EN" },
  { id: "zh", name: "中文", short: "中" },
  { id: "ja", name: "日本語", short: "あ" },
  { id: "ko", name: "한국어", short: "한" },
  { id: "es", name: "Español", short: "ES" },
  { id: "fr", name: "Français", short: "FR" },
  { id: "de", name: "Deutsch", short: "DE" },
  { id: "pt", name: "Português", short: "PT" },
  { id: "ru", name: "Русский", short: "РУ" },
  { id: "th", name: "ไทย", short: "ไทย" },
  { id: "id", name: "Indonesia", short: "ID" },
  { id: "hi", name: "हिन्दी", short: "हि" },
  { id: "ar", name: "العربية", short: "ع" },
] as const;

export type { Lang };

const KEY = "celestial-lang";
const listeners = new Set<() => void>();
let current: Lang = "vi";

function isLang(value: string): value is Lang {
  return LANGS.some((item) => item.id === value);
}

function readStored(): Lang {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && isLang(saved)) return saved;
  } catch {
    /* private mode */
  }
  return "vi";
}

function applyDom(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

if (typeof window !== "undefined") {
  current = readStored();
  applyDom(current);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang) {
  current = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* private mode */
  }
  applyDom(next);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function translate(lang: Lang, key: UiKey, vars?: Record<string, string | number>): string {
  const raw = UI[lang][key] || UI.vi[key] || key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

export function useT() {
  const lang = useSyncExternalStore(subscribe, getLang, () => "vi" as Lang);
  const t = (key: UiKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  return { lang, setLang, t, lesson: (item: Lesson) => localizeLesson(lang, item) };
}

export function formatStatus(t: (key: UiKey, vars?: Record<string, string | number>) => string, report: Outcome, turn: "w" | "b"): string {
  if (report.reason === "checkmate") return report.result === "1-0" ? t("mateWhite") : t("mateBlack");
  if (report.reason === "stalemate") return t("staleText");
  if (report.reason === "repetition") return t("repeatText");
  if (report.reason === "insufficient") return t("weakText");
  if (report.reason === "fifty") return t("fiftyText");
  const side = turn === "w" ? t("white") : t("black");
  return report.inCheck ? t("checkTurn", { side }) : t("sideTurn", { side });
}

export function formatResult(t: (key: UiKey) => string, result: string | null, reason: string | null): string {
  if (!result) return t("inProgress");
  const who = result === "1-0" ? t("whiteWins") : result === "0-1" ? t("blackWins") : t("drawWord");
  const why: Record<string, UiKey> = {
    checkmate: "whyMate",
    resign: "whyResign",
    stalemate: "whyStale",
    repetition: "whyRepeat",
    insufficient: "whyWeak",
    fifty: "whyFifty",
    draw: "whyAgreed",
  };
  const key = reason ? why[reason] : undefined;
  return key ? `${who} — ${t(key)}` : who;
}

export function pieceLabel(t: (key: UiKey) => string, type: string): string {
  const map: Record<string, UiKey> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  const key = map[type];
  return key ? t(key) : type;
}

export function themeLabel(t: (key: UiKey) => string, id: string, fallback: string): string {
  const map: Record<string, UiKey> = {
    crystal: "thCrystal",
    rome: "thRome",
    anime: "thAnime",
    sanguo: "thSanguo",
    nile: "thNile",
    frost: "thFrost",
    neon: "thNeon",
    viet: "thViet",
    sengoku: "thSengoku",
    classic: "thClassic",
  };
  const key = map[id];
  return key ? t(key) : fallback;
}

export function tintLabel(t: (key: UiKey) => string, id: string, fallback: string): string {
  const map: Record<string, UiKey> = { none: "tnNone", ember: "tnEmber", tide: "tnTide", aurora: "tnAurora" };
  const key = map[id];
  return key ? t(key) : fallback;
}

export function levelName(t: (key: UiKey) => string, id: number): string {
  const map: Record<number, UiKey> = { 1: "lv1", 2: "lv2", 3: "lv3", 4: "lv4", 5: "lv5" };
  return t(map[id] ?? "lv3");
}

export function levelBlurb(t: (key: UiKey) => string, id: number): string {
  const map: Record<number, UiKey> = { 1: "lv1b", 2: "lv2b", 3: "lv3b", 4: "lv4b", 5: "lv5b" };
  return t(map[id] ?? "lv3b");
}
