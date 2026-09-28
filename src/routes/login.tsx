import { createFileRoute, Link } from "@tanstack/react-router";
import { SignPanel } from "@/components/auth/SignPanel";
import { authEnabled } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="panel w-full max-w-md p-6">
        <p className="text-xs tracking-[0.22em] text-gold uppercase">Celestial Crystal</p>
        <h1 className="mt-2 text-3xl">Vào sảnh</h1>
        <p className="mt-2 text-sm text-muted">
          Đăng nhập để thách đấu, kết bạn và xem các trận đang diễn ra. Đấu với tinh tú thì không cần tài khoản.
        </p>
        <div className="mt-5">
          {authEnabled ? <SignPanel callback="/" /> : <p className="text-sm text-muted">Đăng nhập đang tắt.</p>}
        </div>
        <Link to="/" className="btn mt-4 w-full">
          Về bàn cờ
        </Link>
      </div>
    </main>
  );
}
