import { useEffect, useState } from "react";
import { TINTS, THEMES, readSavedTheme, readSavedTint, type TintId } from "./themes";

export function ThemePicker() {
  const [themeId, setThemeId] = useState("crystal");
  const [tint, setTint] = useState<TintId>("none");
  useEffect(() => {
    const read = () => {
      setThemeId(readSavedTheme());
      setTint(readSavedTint());
    };
    read();
    window.addEventListener("celestial-theme", read);
    return () => window.removeEventListener("celestial-theme", read);
  }, []);

  const chooseTheme = (id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem("celestial-theme", id);
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new Event("celestial-theme"));
  };

  const chooseTint = (id: TintId) => {
    setTint(id);
    try {
      localStorage.setItem("celestial-tint", id);
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new Event("celestial-theme"));
  };

  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">Kiểu quân</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {THEMES.map((item) => (
          <button key={item.id} type="button" className="chip shrink-0" data-on={themeId === item.id} onClick={() => chooseTheme(item.id)}>
            {item.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">Hiệu ứng màu</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {TINTS.map((item) => (
          <button key={item.id} type="button" className="chip shrink-0" data-on={tint === item.id} onClick={() => chooseTint(item.id)}>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}