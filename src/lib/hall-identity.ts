const KEY = "celestial-guest";

export type GuestSession = {
  userId: string;
  displayName: string;
};

export function readGuest(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestSession>;
    if (!parsed.userId || !/^guest_[a-f0-9]{24}$/.test(parsed.userId)) return null;
    if (!parsed.displayName || parsed.displayName.length < 2) return null;
    return { userId: parsed.userId, displayName: parsed.displayName.slice(0, 24) };
  } catch {
    return null;
  }
}

export function writeGuest(session: GuestSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearGuest() {
  localStorage.removeItem(KEY);
}
