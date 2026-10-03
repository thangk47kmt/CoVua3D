import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, Eye, Swords, UserPlus } from "lucide-react";
import { SoundButton } from "@/components/chess/MatchChrome";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { UserButton } from "@/lib/auth/gates";
import { clearGuest, writeGuest } from "@/lib/hall-identity";
import { useHallIdentity } from "@/components/hall/use-hall-identity";
import { formatResult, getLang, translate, useT } from "@/i18n";
import {
  addFriend,
  answerChallenge,
  cancelChallenge,
  challengePlayer,
  renameProfile,
  respondFriend,
  syncHall,
  type HallSnapshot,
} from "@/lib/hall";

export function HallView() {
  const { t } = useT();
  const { real, guest } = useHallIdentity();
  const navigate = useNavigate();
  const [snap, setSnap] = useState<HallSnapshot | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<"white" | "black" | "random">("random");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const next = await syncHall({ data: { displayName: real?.displayName ?? guest?.displayName ?? undefined } });
    setSnap(next);
    setName((current) => current || next.profile.displayName);
  }

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const next = await syncHall({ data: { displayName: real?.displayName ?? guest?.displayName ?? undefined } });
        if (!stop) {
          setSnap(next);
          setError("");
          setName((current) => current || next.profile.displayName);
        }
      } catch {
        if (!stop) setError(translate(getLang(), "hallDown"));
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 3000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [real?.displayName, guest?.displayName]);

  async function act(task: () => Promise<{ ok: boolean; error?: string; gameId?: string }>, enter?: boolean) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await task();
      if (!result.ok) setError(result.error ?? translate(getLang(), "cannot"));
      else if (enter && result.gameId) {
        void navigate({ to: "/match/$id", params: { id: result.gameId } });
        return;
      } else setNotice(translate(getLang(), "updated"));
      if (guest && name.trim().length >= 2) {
        writeGuest({ userId: guest.userId, displayName: name.trim().slice(0, 24) });
      }
      await refresh();
    } catch {
      setError(translate(getLang(), "hallError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.22em] text-gold uppercase">Celestial Crystal</p>
          <h1 className="text-3xl">{t("hallTitle")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn btn-ghost">
            {t("versusBot")}
          </Link>
          <LanguageButton />
          <SoundButton />
          {real ? (
            <UserButton />
          ) : (
            guest && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  clearGuest();
                  window.location.assign("/hall");
                }}
              >
                {t("leaveHall")}
              </button>
            )
          )}
        </div>
      </header>
      {error && <p className="text-sm text-danger">{error}</p>}
      {notice && <p className="text-sm text-ok">{notice}</p>}
      {!snap ? (
        <p className="text-muted">{t("hallWait")}</p>
      ) : (
        <>
          <section className="panel grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-xs tracking-[0.14em] text-muted uppercase">{t("hallName")}</span>
              <input className="field mt-2" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={() => void act(() => renameProfile({ data: name }))}>
              {t("saveName")}
            </button>
            <div className="sm:col-span-2">
              <p className="text-xs tracking-[0.14em] text-muted uppercase">{t("friendCode")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="font-display text-2xl tracking-[0.28em] text-gold">{snap.profile.friendCode}</p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void navigator.clipboard?.writeText(snap.profile.friendCode).then(() => setNotice(t("copied"))).catch(() => setNotice(snap.profile.friendCode))}
                >
                  <Copy size={16} /> {t("copyCode")}
                </button>
              </div>
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="text-xl">{t("challenges")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["random", t("randomColor")],
                  ["white", t("youHoldWhite")],
                  ["black", t("youHoldBlack")],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" className="chip" data-on={color === value} onClick={() => setColor(value)}>
                  {label}
                </button>
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {snap.challenges.length === 0 && <li className="text-sm text-muted">{t("noChallenges")}</li>}
              {snap.challenges.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {item.incoming ? item.fromName : item.toName}
                    <span className="text-muted"> · {item.status === "accepted" ? t("accepted") : item.incoming ? t("theyChallenge") : t("youSentCh")}</span>
                  </p>
                  <div className="flex gap-2">
                    {item.gameId && (
                      <Link to="/match/$id" params={{ id: item.gameId }} className="btn btn-gold">
                        {t("enterTable")}
                      </Link>
                    )}
                    {item.status === "pending" && item.incoming && (
                      <>
                        <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void act(() => answerChallenge({ data: { challengeId: item.id, accept: true } }), true)}>
                          {t("accept")}
                        </button>
                        <button type="button" className="btn" disabled={busy} onClick={() => void act(() => answerChallenge({ data: { challengeId: item.id, accept: false } }))}>
                          {t("decline")}
                        </button>
                      </>
                    )}
                    {item.status === "pending" && !item.incoming && (
                      <button type="button" className="btn" disabled={busy} onClick={() => void act(() => cancelChallenge({ data: item.id }))}>
                        {t("cancel")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4">
            <h2 className="text-xl">{t("yourGames")}</h2>
            <ul className="mt-3 space-y-2">
              {snap.myGames.length === 0 && <li className="text-sm text-muted">{t("noYourGames")}</li>}
              {snap.myGames.map((game) => (
                <li key={game.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {game.whiteName} <span className="text-muted">vs</span> {game.blackName}
                    <span className="text-muted"> · {game.status === "playing" ? t("playingNow") : formatResult(t, game.result, game.reason)}</span>
                  </p>
                  <Link to="/match/$id" params={{ id: game.id }} className="btn">
                    {game.status === "playing" ? t("continueGame") : t("reviewGame")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel p-4">
              <h2 className="flex items-center gap-2 text-xl">
                <Swords size={18} /> {t("onlineTitle")}
              </h2>
              <ul className="mt-3 space-y-2">
                {snap.online.length === 0 && <li className="text-sm text-muted">{t("alone")}</li>}
                {snap.online.map((person) => (
                  <li key={person.userId} className="flex items-center justify-between gap-2">
                    <p>
                      {person.displayName}
                      <span className="text-muted"> · {relationLabel(t, person.relation)}</span>
                    </p>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => void act(() => challengePlayer({ data: { toId: person.userId, color } }))}
                    >
                      {t("challenge")}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel p-4">
              <h2 className="flex items-center gap-2 text-xl">
                <UserPlus size={18} /> {t("friendsTitle")}
              </h2>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void act(() => addFriend({ data: code })).then(() => setCode(""));
                }}
              >
                <input className="field" placeholder={t("codePh")} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                <button type="submit" className="btn btn-gold" disabled={busy}>
                  {t("addFriend")}
                </button>
              </form>
              <ul className="mt-3 space-y-2">
                {snap.friends.length === 0 && <li className="text-sm text-muted">{t("noFriends")}</li>}
                {snap.friends.map((friend) => (
                  <li key={friend.friendshipId} className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      {friend.displayName}
                      <span className="text-muted"> · {friend.status === "accepted" ? (friend.online ? t("wordOnline") : t("wordOffline")) : friend.incoming ? t("relIncoming") : t("sentInvite")}</span>
                    </p>
                    <div className="flex gap-2">
                      {friend.incoming && (
                        <>
                          <button type="button" className="btn" disabled={busy} onClick={() => void act(() => respondFriend({ data: { friendshipId: friend.friendshipId, accept: true } }))}>
                            {t("accept")}
                          </button>
                          <button type="button" className="btn" disabled={busy} onClick={() => void act(() => respondFriend({ data: { friendshipId: friend.friendshipId, accept: false } }))}>
                            {t("decline")}
                          </button>
                        </>
                      )}
                      {friend.status === "accepted" && (
                        <button type="button" className="btn" disabled={busy} onClick={() => void act(() => challengePlayer({ data: { toId: friend.userId, color } }))}>
                          {t("challenge")}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="panel p-4">
            <h2 className="flex items-center gap-2 text-xl">
              <Eye size={18} /> {t("liveTitle")}
            </h2>
            <ul className="mt-3 space-y-2">
              {snap.liveGames.length === 0 && <li className="text-sm text-muted">{t("noLive")}</li>}
              {snap.liveGames.map((game) => (
                <li key={game.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {game.whiteName} <span className="text-muted">vs</span> {game.blackName}
                  </p>
                  <Link to="/match/$id" params={{ id: game.id }} className="btn">
                    {t("watch")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function relationLabel(t: (key: "relFriend" | "relIncoming" | "relOutgoing" | "relGuest") => string, relation: string): string {
  if (relation === "friend") return t("relFriend");
  if (relation === "incoming") return t("relIncoming");
  if (relation === "outgoing") return t("relOutgoing");
  return t("relGuest");
}
