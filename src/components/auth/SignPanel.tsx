import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useT } from "@/i18n";

export function SignPanel({ callback = "/" }: { callback?: string }) {
  const { t } = useT();
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {GROK_PROVIDERS.map((provider) => (
        <button
          key={provider.providerId}
          type="button"
          className="btn btn-gold"
          onClick={() => signIn(provider.providerId, { callbackURL: callback })}
        >
          {t("continueWith", { name: provider.label })}
        </button>
      ))}
    </div>
  );
}
