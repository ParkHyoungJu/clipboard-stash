import { useMemo } from "react";
import type { ClipboardEntry } from "../lib/types";
import type { CompiledQuery, Range } from "../lib/search";
import { maskText, type Segment } from "../lib/mask";

interface Props {
  entry: ClipboardEntry;
  selected: boolean;
  query: CompiledQuery;
  maskEnabled: boolean;
  /** 화면 표시 순서 1-based (Ctrl+1~9 단축키와 매핑). 10 이상은 undefined. */
  displayIndex?: number;
  onSelect: () => void;
  onCopy: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

const SOURCE_ICON: Record<string, string> = {
  browser: "🌐",
  "Code.exe": "💻",
  "Figma.exe": "🎨",
  "outlook.exe": "✉️",
  "DataGrip.exe": "🗄️",
  "chrome.exe": "🌐",
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/**
 * 한 항목 렌더 — 마스킹 + 검색 하이라이트를 동시에 적용.
 *
 * 주의: 마스킹이 텍스트 길이를 바꾸므로, 하이라이트는 **마스킹 후 텍스트** 기준으로 다시 계산.
 * (정확한 인덱스 매핑은 데스크톱 빌드에서 강화 — MVP는 시각 일관성 우선.)
 */
export function HistoryItem({
  entry,
  selected,
  query,
  maskEnabled,
  displayIndex,
  onSelect,
  onCopy,
  onTogglePin,
  onDelete,
}: Props) {
  const segments = useMemo<Segment[]>(
    () => maskText(entry.text, maskEnabled),
    [entry.text, maskEnabled]
  );

  // 표시용 미리보기는 80자 기준 + 줄바꿈 1개로 잘라.
  const previewSegments = useMemo<Segment[]>(() => {
    return clipSegments(segments, 160);
  }, [segments]);

  const masked = previewSegments.map((s) => s.text).join("");
  const ranges = query.ranges(masked);

  const cls = [
    "history-item",
    selected ? "is-selected" : "",
    entry.pin > 0 ? "is-pinned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      onClick={onSelect}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCopy();
        }
      }}
    >
      <div>
        {entry.pin > 0 ? (
          <span className="history-pin-num" title={`핀 #${entry.pin}`}>
            {entry.pin}
          </span>
        ) : (
          <span className="history-source" aria-hidden="true">
            {SOURCE_ICON[entry.source] ?? "📋"}
          </span>
        )}
      </div>

      <div>
        <div className="history-text">
          {renderSegments(previewSegments, ranges)}
        </div>
        <div className="history-meta">
          <span className="muted">{timeAgo(entry.createdAt)}</span>
          <span className="muted">· {entry.text.length}자</span>
          <span className="muted">· {entry.source}</span>
          {entry.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="history-hotkeys" aria-hidden>
        {displayIndex !== undefined && displayIndex >= 1 && displayIndex <= 9 && (
          <span className="hk-chip" title={`Ctrl+${displayIndex} 즉시 복사`}>
            <kbd>Ctrl</kbd>+<kbd>{displayIndex}</kbd>
          </span>
        )}
        {entry.pin >= 1 && entry.pin <= 9 && (
          <span className="hk-chip hk-chip-pin" title={`Alt+${entry.pin} 핀 즉시 복사`}>
            <kbd>Alt</kbd>+<kbd>{entry.pin}</kbd>
          </span>
        )}
      </div>

      <div className="history-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`icon-btn${entry.pin > 0 ? " is-active" : ""}`}
          onClick={onTogglePin}
          title={entry.pin > 0 ? "핀 해제" : "핀 고정"}
          aria-label={entry.pin > 0 ? "핀 해제" : "핀 고정"}
        >
          {entry.pin > 0 ? "★" : "☆"}
        </button>
        <button
          className="icon-btn"
          onClick={onCopy}
          title="복사"
          aria-label="클립보드에 복사"
        >
          ⎘
        </button>
        <button
          className="icon-btn"
          onClick={onDelete}
          title="삭제"
          aria-label="삭제"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * 마스킹 segment 배열을 maxLen 자 기준으로 잘라낸다 (text segment는 길이로, mask segment는 통째로).
 */
function clipSegments(segs: Segment[], maxLen: number): Segment[] {
  let used = 0;
  const out: Segment[] = [];
  for (const s of segs) {
    if (used >= maxLen) break;
    const remaining = maxLen - used;
    if (s.type === "mask") {
      // 마스크는 통째로 (의미를 유지).
      out.push(s);
      used += s.text.length;
      continue;
    }
    if (s.text.length <= remaining) {
      out.push(s);
      used += s.text.length;
    } else {
      out.push({ type: "text", text: s.text.slice(0, remaining) + "…" });
      used = maxLen;
    }
  }
  return out;
}

/**
 * segment + 검색 하이라이트 결합 렌더.
 *
 * 알고리즘: 각 text segment의 **표시 텍스트 기준** 인덱스를
 * 누적 ranges 와 비교해 분할. mask segment는 항상 .masked 로 감싸 강조 분할 X.
 */
function renderSegments(segs: Segment[], ranges: Range[]): JSX.Element[] {
  const nodes: JSX.Element[] = [];
  let cursor = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const segStart = cursor;
    const segEnd = cursor + s.text.length;

    if (s.type === "mask") {
      nodes.push(
        <span key={i} className="masked" title={`마스킹: ${s.label}`}>
          {s.text}
        </span>
      );
    } else {
      const localRanges = ranges
        .filter((r) => r.start < segEnd && r.end > segStart)
        .map((r) => ({
          start: Math.max(0, r.start - segStart),
          end: Math.min(s.text.length, r.end - segStart),
        }))
        .filter((r) => r.end > r.start);

      if (localRanges.length === 0) {
        nodes.push(<span key={i}>{s.text}</span>);
      } else {
        let pos = 0;
        const inner: JSX.Element[] = [];
        localRanges.forEach((r, ri) => {
          if (r.start > pos) inner.push(<span key={`p${ri}`}>{s.text.slice(pos, r.start)}</span>);
          inner.push(
            <mark key={`h${ri}`} className="highlight">
              {s.text.slice(r.start, r.end)}
            </mark>
          );
          pos = r.end;
        });
        if (pos < s.text.length) inner.push(<span key="tail">{s.text.slice(pos)}</span>);
        nodes.push(<span key={i}>{inner}</span>);
      }
    }

    cursor = segEnd;
  }
  return nodes;
}
