import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState, type AppUser } from "@/lib/auth/use-current-user";
import { readGuest, type GuestSession } from "@/lib/hall-identity";

export function useHallIdentity() {
  const { user, isPending } = useCurrentUserState();
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const [guestReady, setGuestReady] = useState(false);
  const reload = useCallback(() => {
    setGuest(readGuest());
    setGuestReady(true);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  const real: AppUser | null = user && !user.isDevFallback ? user : null;
  return {
    ready: !isPending && guestReady,
    present: Boolean(real || guest),
    real,
    guest: real ? null : guest,
    reload,
  };
}
