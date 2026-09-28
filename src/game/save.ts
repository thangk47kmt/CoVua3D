export const SAVE_KEY = "celestial-crystal-v1";

export type SavedGame = {
  version: 1;
  level: number;
  playerColor: "w" | "b";
  sans: string[];
};

export function readSave(): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedGame;
    if (data.version !== 1 || !Array.isArray(data.sans)) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SavedGame): void {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function clearSave(): void {
  window.localStorage.removeItem(SAVE_KEY);
}
