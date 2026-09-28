import { useState, type FormEvent } from "react";
import { SignPanel } from "@/components/auth/SignPanel";
import { authEnabled } from "@/lib/auth/client";
import { enterAsGuest } from "@/lib/hall";
import { writeGuest } from "@/lib/hall-identity";

export function HallGate({ callback, onEntered }: { callback: string; onEntered: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await enterAsGuest({ data: { displayName: name } });
      writeGuest(session);
      onEntered();
    } catch {
      setError("Không vào được. Hãy dùng một tên từ 2 ký tự trở lên.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="panel w-full max-w-md p-6">
        <p className="text-xs tracking-[0.22em] text-gold uppercase">Sảnh người chơi</p>
        <h1 className="mt-2 text-3xl">Thách đấu giữa các vì sao</h1>
        <p className="mt-2 text-sm text-muted">
          Đăng nhập bằng mạng xã hội, hoặc chỉ cần điền tên người chơi để thách đấu và xem các ván đang diễn ra.
        </p>
        {authEnabled && (
          <div className="mt-5">
            <SignPanel callback={callback} />
          </div>
        )}
        {authEnabled && <p className="mt-4 text-center text-xs tracking-[0.16em] text-muted uppercase">hoặc</p>}
        <form className="mt-4 grid gap-3" onSubmit={(event) => void submit(event)}>
          <label className="block">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Tên người chơi</span>
            <input
              className="field mt-2"
              value={name}
              maxLength={24}
              minLength={2}
              required
              autoComplete="nickname"
              placeholder="Ví dụ: Linh tinh tú"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn btn-gold" disabled={busy}>
            {busy ? "Đang vào sảnh…" : "Vào sảnh với tên này"}
          </button>
        </form>
      </div>
    </main>
  );
}
