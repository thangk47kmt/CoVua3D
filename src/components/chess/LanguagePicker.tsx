import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages } from "lucide-react";
import { LANGS, useT } from "@/i18n";

export function LanguageButton() {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ top: 0, right: 8 });
  const titleId = useId();
  const current = LANGS.find((item) => item.id === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = box.current?.getBoundingClientRect();
      if (!rect) return;
      setPlace({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    };
    update();
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (box.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        className="btn btn-ghost min-w-11 gap-2 px-3"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("language")}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages size={18} />
        <span className="text-xs tracking-[0.12em]">{current.short}</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-labelledby={titleId}
            className="lang-sheet"
            style={{ top: place.top, right: place.right }}
          >
            <p id={titleId} className="px-1 text-xs tracking-[0.18em] text-gold uppercase">
              {t("language")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LANGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="lang-option"
                  data-on={item.id === lang}
                  lang={item.id === "zh" ? "zh-Hans" : item.id}
                  dir={item.id === "ar" ? "rtl" : "ltr"}
                  onClick={() => {
                    setLang(item.id);
                    setOpen(false);
                  }}
                >
                  <span className="lang-native">{item.name}</span>
                  <span className="mark">{item.short}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
