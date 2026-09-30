import { useEffect, useState } from "react";
import { TINTS, THEMES, readSavedTheme, readSavedTint, type TintId } from "./themes";

const FEATURED = new Set(["crystal", "viet", "sanguo"]);

export function ThemePicker() {
  const [themeId, setThemeId] = useState("crystal");
  const [tint, setTint] = useState<TintId>("none");
  const [more, setMore] = useState(false);
  useEffect(() => {
    const read = () => {
      const saved = readSavedTheme();
      setThemeId(saved);
      setTint(readSavedTint());
      if (!FEATURED.has(saved)) setMore(true);
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

  const featured = THEMES.filter((item) => FEATURED.has(item.id));
  const rest = THEMES.filter((item) => !FEATURED.has(item.id));
  const shown = more ? rest : rest.filter((item) => item.id === themeId);

  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">Kiểu quân</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {featured.map((item) => (
          <button key={item.id} type="button" className="chip shrink-0" data-on={themeId === item.id} onClick={() => chooseTheme(item.id)}>
            {item.name}
          </button>
        ))}
        {shown.map((item) => (
          <button key={item.id} type="button" className="chip shrink-0" data-on={themeId === item.id} onClick={() => chooseTheme(item.id)}>
            {item.name}
          </button>
        ))}
        <button type="button" className="chip shrink-0" data-on={more} onClick={() => setMore((value) => !value)}>
          {more ? "Thu gọn" : "Thêm"}
        </button>
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