import { useState, type FormEvent } from "react";
import { SignPanel } from "@/components/auth/SignPanel";
import { LanguageButton } from "@/components/chess/LanguagePicker";
import { authEnabled } from "@/lib/auth/client";
import { enterAsGuest } from "@/lib/hall";
import { writeGuest } from "@/lib/hall-identity";
import { getLang, translate, useT } from "@/i18n";

export function HallGate({ callback, onEntered }: { callback: string; onEntered: () => void }) {
  const { t } = useT();
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
      setError(translate(getLang(), "nameError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="panel w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs tracking-[0.22em] text-gold uppercase">{t("gateKicker")}</p>
          <LanguageButton />
        </div>
        <h1 className="mt-2 text-3xl">{t("gateTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("gateBody")}</p>
        {authEnabled && (
          <div className="mt-5">
            <SignPanel callback={callback} />
          </div>
        )}
        {authEnabled && <p className="mt-4 text-center text-xs tracking-[0.16em] text-muted uppercase">{t("orWord")}</p>}
        <form className="mt-4 grid gap-3" onSubmit={(event) => void submit(event)}>
          <label className="block">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">{t("playerName")}</span>
            <input
              className="field mt-2"
              value={name}
              maxLength={24}
              minLength={2}
              required
              autoComplete="nickname"
              placeholder={t("nameExample")}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn btn-gold" disabled={busy}>
            {busy ? t("entering") : t("enterNamed")}
          </button>
        </form>
      </div>
    </main>
  );
}
