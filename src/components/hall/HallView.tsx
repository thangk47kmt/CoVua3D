import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, Eye, Swords, UserPlus } from "lucide-react";
import { SoundButton } from "@/components/chess/MatchChrome";
import { resultLabel } from "@/game/notation";
import { UserButton } from "@/lib/auth/gates";
import { clearGuest, writeGuest } from "@/lib/hall-identity";
import { useHallIdentity } from "@/components/hall/use-hall-identity";
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
        if (!stop) setError("Sảnh chưa mở được. Thử lại sau giây lát.");
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
      if (!result.ok) setError(result.error ?? "Không thực hiện được.");
      else if (enter && result.gameId) {
        void navigate({ to: "/match/$id", params: { id: result.gameId } });
        return;
      } else setNotice("Đã cập nhật.");
      if (guest && name.trim().length >= 2) {
        writeGuest({ userId: guest.userId, displayName: name.trim().slice(0, 24) });
      }
      await refresh();
    } catch {
      setError("Có lỗi khi nói chuyện với sảnh.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.22em] text-gold uppercase">Celestial Crystal</p>
          <h1 className="text-3xl">Sảnh thách đấu</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn btn-ghost">
            Đấu với tinh tú
          </Link>
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
                Rời sảnh
              </button>
            )
          )}
        </div>
      </header>
      {error && <p className="text-sm text-danger">{error}</p>}
      {notice && <p className="text-sm text-ok">{notice}</p>}
      {!snap ? (
        <p className="text-muted">Đang gọi các tinh tú trong sảnh…</p>
      ) : (
        <>
          <section className="panel grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-xs tracking-[0.14em] text-muted uppercase">Tên trong sảnh</span>
              <input className="field mt-2" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={() => void act(() => renameProfile({ data: name }))}>
              Lưu tên
            </button>
            <div className="sm:col-span-2">
              <p className="text-xs tracking-[0.14em] text-muted uppercase">Mã bạn bè</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="font-display text-2xl tracking-[0.28em] text-gold">{snap.profile.friendCode}</p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void navigator.clipboard?.writeText(snap.profile.friendCode).then(() => setNotice("Đã chép mã.")).catch(() => setNotice(snap.profile.friendCode))}
                >
                  <Copy size={16} /> Chép mã
                </button>
              </div>
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="text-xl">Lời thách đấu</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["random", "Màu ngẫu nhiên"],
                  ["white", "Bạn cầm Trắng"],
                  ["black", "Bạn cầm Đen"],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" className="chip" data-on={color === value} onClick={() => setColor(value)}>
                  {label}
                </button>
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {snap.challenges.length === 0 && <li className="text-sm text-muted">Chưa có lời thách đấu.</li>}
              {snap.challenges.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {item.incoming ? item.fromName : item.toName}
                    <span className="text-muted"> · {item.status === "accepted" ? "đã nhận" : item.incoming ? "thách bạn" : "bạn đã gửi"}</span>
                  </p>
                  <div className="flex gap-2">
                    {item.gameId && (
                      <Link to="/match/$id" params={{ id: item.gameId }} className="btn btn-gold">
                        Vào bàn
                      </Link>
                    )}
                    {item.status === "pending" && item.incoming && (
                      <>
                        <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void act(() => answerChallenge({ data: { challengeId: item.id, accept: true } }), true)}>
                          Nhận
                        </button>
                        <button type="button" className="btn" disabled={busy} onClick={() => void act(() => answerChallenge({ data: { challengeId: item.id, accept: false } }))}>
                          Từ chối
                        </button>
                      </>
                    )}
                    {item.status === "pending" && !item.incoming && (
                      <button type="button" className="btn" disabled={busy} onClick={() => void act(() => cancelChallenge({ data: item.id }))}>
                        Hủy
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4">
            <h2 className="text-xl">Ván của bạn</h2>
            <ul className="mt-3 space-y-2">
              {snap.myGames.length === 0 && <li className="text-sm text-muted">Bạn chưa có ván nào. Hãy thách một người trong sảnh.</li>}
              {snap.myGames.map((game) => (
                <li key={game.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {game.whiteName} <span className="text-muted">vs</span> {game.blackName}
                    <span className="text-muted"> · {game.status === "playing" ? "đang chơi" : resultLabel(game.result, game.reason)}</span>
                  </p>
                  <Link to="/match/$id" params={{ id: game.id }} className="btn">
                    {game.status === "playing" ? "Tiếp tục" : "Xem lại"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel p-4">
              <h2 className="flex items-center gap-2 text-xl">
                <Swords size={18} /> Đang online
              </h2>
              <ul className="mt-3 space-y-2">
                {snap.online.length === 0 && <li className="text-sm text-muted">Chỉ có mình bạn. Gửi mã bạn bè để rủ người khác.</li>}
                {snap.online.map((person) => (
                  <li key={person.userId} className="flex items-center justify-between gap-2">
                    <p>
                      {person.displayName}
                      <span className="text-muted"> · {relationLabel(person.relation)}</span>
                    </p>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => void act(() => challengePlayer({ data: { toId: person.userId, color } }))}
                    >
                      Thách đấu
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel p-4">
              <h2 className="flex items-center gap-2 text-xl">
                <UserPlus size={18} /> Bạn bè
              </h2>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void act(() => addFriend({ data: code })).then(() => setCode(""));
                }}
              >
                <input className="field" placeholder="Nhập mã bạn bè" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                <button type="submit" className="btn btn-gold" disabled={busy}>
                  Kết bạn
                </button>
              </form>
              <ul className="mt-3 space-y-2">
                {snap.friends.length === 0 && <li className="text-sm text-muted">Chưa có bạn. Đổi mã với người chơi khác.</li>}
                {snap.friends.map((friend) => (
                  <li key={friend.friendshipId} className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      {friend.displayName}
                      <span className="text-muted"> · {friend.status === "accepted" ? (friend.online ? "online" : "offline") : friend.incoming ? "muốn kết bạn" : "đã gửi lời mời"}</span>
                    </p>
                    <div className="flex gap-2">
                      {friend.incoming && (
                        <>
                          <button type="button" className="btn" disabled={busy} onClick={() => void act(() => respondFriend({ data: { friendshipId: friend.friendshipId, accept: true } }))}>
                            Nhận
                          </button>
                          <button type="button" className="btn" disabled={busy} onClick={() => void act(() => respondFriend({ data: { friendshipId: friend.friendshipId, accept: false } }))}>
                            Từ chối
                          </button>
                        </>
                      )}
                      {friend.status === "accepted" && (
                        <button type="button" className="btn" disabled={busy} onClick={() => void act(() => challengePlayer({ data: { toId: friend.userId, color } }))}>
                          Thách đấu
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
              <Eye size={18} /> Trận đang diễn ra
            </h2>
            <ul className="mt-3 space-y-2">
              {snap.liveGames.length === 0 && <li className="text-sm text-muted">Chưa có trận nào để xem. Khi có người đấu, bàn cờ sẽ hiện ở đây.</li>}
              {snap.liveGames.map((game) => (
                <li key={game.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <p>
                    {game.whiteName} <span className="text-muted">vs</span> {game.blackName}
                  </p>
                  <Link to="/match/$id" params={{ id: game.id }} className="btn">
                    Xem
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

function relationLabel(relation: string): string {
  if (relation === "friend") return "bạn bè";
  if (relation === "incoming") return "muốn kết bạn";
  if (relation === "outgoing") return "đã mời";
  return "khách";
}
