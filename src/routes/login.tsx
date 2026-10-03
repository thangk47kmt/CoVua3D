import { createFileRoute, Link } from "@tanstack/react-router";
import { SignPanel } from "@/components/auth/SignPanel";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { authEnabled } from "@/lib/auth/client";
import { useT } from "@/i18n";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useT();
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="panel w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs tracking-[0.22em] text-gold uppercase">Celestial Crystal</p>
          <LanguageButton />
        </div>
        <h1 className="mt-2 text-3xl">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("loginBody")}</p>
        <div className="mt-5">
          {authEnabled ? <SignPanel callback="/" /> : <p className="text-sm text-muted">{t("loginOff")}</p>}
        </div>
        <Link to="/" className="btn mt-4 w-full">
          {t("backBoard")}
        </Link>
      </div>
    </main>
  );
}
