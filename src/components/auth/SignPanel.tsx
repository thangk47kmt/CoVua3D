import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";

export function SignPanel({ callback = "/" }: { callback?: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {GROK_PROVIDERS.map((provider) => (
        <button
          key={provider.providerId}
          type="button"
          className="btn btn-gold"
          onClick={() => signIn(provider.providerId, { callbackURL: callback })}
        >
          Tiếp tục với {provider.label}
        </button>
      ))}
    </div>
  );
}
