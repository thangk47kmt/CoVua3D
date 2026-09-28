import { useEffect, useState } from "react";
import { THEMES } from "./themes";

export function ThemePicker() {
  const [themeId, setThemeId] = useState("crystal");
  useEffect(() => {
    const read = () => {
      const saved = localStorage.getItem("celestial-theme");
      if (saved && THEMES.some((item) => item.id === saved)) setThemeId(saved);
    };
    read();
    window.addEventListener("celestial-theme", read);
    return () => window.removeEventListener("celestial-theme", read);
  }, []);

  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">Kiểu quân</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip shrink-0"
            data-on={themeId === item.id}
            onClick={() => {
              setThemeId(item.id);
              try {
                localStorage.setItem("celestial-theme", item.id);
              } catch {
                /* private mode */
              }
              window.dispatchEvent(new Event("celestial-theme"));
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
