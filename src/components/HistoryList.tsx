import { useMemo } from "react";
import type { ClipboardEntry } from "../lib/types";
import type { CompiledQuery } from "../lib/search";
import { HistoryItem } from "./HistoryItem";

interface Props {
  entries: ClipboardEntry[];
  query: CompiledQuery;
  selectedId: string | null;
  maskEnabled: boolean;
  onSelect: (id: string) => void;
  onCopy: (entry: ClipboardEntry) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * 핀 우선 + 최근순 정렬된 리스트. 검색어 적용 후 결과만 렌더.
 */
export function HistoryList({
  entries,
  query,
  selectedId,
  maskEnabled,
  onSelect,
  onCopy,
  onTogglePin,
  onDelete,
}: Props) {
  const filtered = useMemo(() => {
    if (!query.raw.trim()) return entries;
    return entries.filter((e) => query.matches(e.text));
  }, [entries, query]);

  const pinned = useMemo(
    () => filtered.filter((e) => e.pin > 0).sort((a, b) => a.pin - b.pin),
    [filtered]
  );
  const rest = useMemo(
    () => filtered.filter((e) => e.pin === 0).sort((a, b) => b.createdAt - a.createdAt),
    [filtered]
  );

  if (filtered.length === 0) {
    return (
      <div className="card">
        <div className="empty-message">
          {entries.length === 0
            ? "아직 항목이 없습니다. 위에서 텍스트를 붙여넣고 '추가'를 눌러보세요."
            : "검색 결과가 없습니다. 검색어 또는 모드를 바꿔보세요."}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="panel-header">
        <span className="panel-title">
          히스토리 ({filtered.length}{filtered.length !== entries.length ? `/${entries.length}` : ""})
        </span>
        <span className="muted">↑↓ 키로 이동, Enter 로 복사</span>
      </div>

      {pinned.length > 0 && (
        <>
          <div className="history-section-title">★ 핀 ({pinned.length})</div>
          <div className="history-list" role="list">
            {pinned.map((e, i) => (
              <HistoryItem
                key={e.id}
                entry={e}
                selected={e.id === selectedId}
                query={query}
                maskEnabled={maskEnabled}
                displayIndex={i + 1}
                onSelect={() => onSelect(e.id)}
                onCopy={() => onCopy(e)}
                onTogglePin={() => onTogglePin(e.id)}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <div className="history-section-title" style={{ marginTop: pinned.length > 0 ? 12 : 0 }}>
            최근
          </div>
          <div className="history-list" role="list">
            {rest.map((e, i) => (
              <HistoryItem
                key={e.id}
                entry={e}
                selected={e.id === selectedId}
                query={query}
                maskEnabled={maskEnabled}
                displayIndex={pinned.length + i + 1}
                onSelect={() => onSelect(e.id)}
                onCopy={() => onCopy(e)}
                onTogglePin={() => onTogglePin(e.id)}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
