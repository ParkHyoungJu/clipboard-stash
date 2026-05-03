import { forwardRef } from "react";
import type { SearchMode } from "../lib/types";

interface Props {
  query: string;
  mode: SearchMode;
  error: string | null;
  onQueryChange: (q: string) => void;
  onModeChange: (m: SearchMode) => void;
  onArrow: (dir: 1 | -1) => void;
  onEnter: () => void;
}

const MODE_LABELS: Record<SearchMode, string> = {
  text: "텍스트",
  regex: "정규식",
  jamo: "자모",
};

/**
 * 검색바 — 3가지 모드 토글 + ↑↓ Enter 키 네비.
 * Alt+/ 단축키로 포커스 (App에서 등록).
 */
export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { query, mode, error, onQueryChange, onModeChange, onArrow, onEnter },
  ref
) {
  return (
    <div className="card">
      <div className="search-bar">
        <input
          ref={ref}
          type="search"
          className="input"
          value={query}
          placeholder="검색… (텍스트·정규식·한글 자모. Alt+/ 으로 포커스)"
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onArrow(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              onArrow(-1);
            } else if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
          aria-label="히스토리 검색"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="search-modes" role="tablist" aria-label="검색 모드">
          {(["text", "regex", "jamo"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`search-mode${mode === m ? " is-active" : ""}`}
              onClick={() => onModeChange(m)}
              type="button"
              title={`${MODE_LABELS[m]} 모드`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="muted" style={{ marginTop: 8, color: "var(--danger)" }}>
          정규식 오류: {error}
        </div>
      )}
    </div>
  );
});
