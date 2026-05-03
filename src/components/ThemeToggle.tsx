import { useEffect, useState } from "react";

/**
 * 테마 토글 — `tfh_theme` localStorage 키 사용 (ToolFunHub 도구 공유).
 *
 * 초기값:
 *   1. localStorage `tfh_theme` 가 있으면 그것 사용
 *   2. 없으면 `prefers-color-scheme` 자동 감지
 */
const STORAGE_KEY = "tfh_theme";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* noop */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      id="themeToggle"
      title="다크/라이트 모드 전환"
      aria-label="테마 전환"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
