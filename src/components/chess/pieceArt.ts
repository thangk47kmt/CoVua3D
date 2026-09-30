import { useEffect, useState } from "react";
import { readSavedTheme, themeById } from "./themes";

const GLYPH: Record<string, string> = {
  "♙": "wP",
  "♘": "wN",
  "♗": "wB",
  "♖": "wR",
  "♕": "wQ",
  "♟": "bP",
  "♞": "bN",
  "♝": "bB",
  "♜": "bR",
  "♛": "bQ",
};

export type PieceSetId = "crystal" | "anime" | "sanguo" | "ember" | "tide" | "aurora" | "rome" | "nile" | "frost" | "neon" | "viet" | "sengoku" | "classic";

const KEYS = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"] as const;

export type PieceKey = (typeof KEYS)[number];

function fileFor(set: PieceSetId, key: string): string {
  if (set === "crystal") return `/pieces/${key}.webp`;
  return `/pieces/${set}/${key}.webp`;
}

export function pieceSetMap(set: PieceSetId): Record<PieceKey, string> {
  const map = {} as Record<PieceKey, string>;
  for (const key of KEYS) map[key] = fileFor(set, key);
  return map;
}

export const ALL_PIECE_TEXTURES: Record<string, string> = {};
for (const set of ["crystal", "anime", "sanguo", "ember", "tide", "aurora", "rome", "nile", "frost", "neon", "viet", "sengoku", "classic"] as const) {
  for (const key of KEYS) ALL_PIECE_TEXTURES[`${set}-${key}`] = fileFor(set, key);
}

export function srcForPiece(color: "w" | "b", type: string, set: PieceSetId = "crystal"): string {
  const key = `${color}${type.toUpperCase()}`;
  return fileFor(set, (KEYS as readonly string[]).includes(key) ? key : "wP");
}

export function srcForGlyph(glyph: string, set: PieceSetId = "crystal"): string {
  const id = GLYPH[glyph];
  return id ? fileFor(set, id) : "";
}

export function usePieceSet(): PieceSetId {
  const [set, setSet] = useState<PieceSetId>("crystal");
  useEffect(() => {
    const read = () => {
      setSet(themeById(readSavedTheme()).pieces);
    };
    read();
    window.addEventListener("celestial-theme", read);
    return () => window.removeEventListener("celestial-theme", read);
  }, []);
  return set;
}

/** Height of each piece in squares. Bases stay on their own square. */
export const PIECE_HEIGHT: Record<string, number> = {
  p: 0.84,
  r: 1.02,
  n: 1.1,
  b: 1.12,
  q: 1.24,
  k: 1.3,
};
