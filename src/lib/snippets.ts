/**
 * 스니펫 변수 치환 엔진.
 *
 * 지원 변수:
 *   {date}      → YYYY-MM-DD (현재 로캘)
 *   {time}      → HH:mm
 *   {datetime}  → YYYY-MM-DD HH:mm
 *   {clipboard} → 직전 클립보드 항목 본문 (없으면 빈 문자열)
 *   {cursor}    → 커서 위치 표식. 결과 문자열에서 제거 (CursorPos로 별도 반환)
 */

export interface ExpandResult {
  text: string;
  /** {cursor} 위치. 없으면 -1. */
  cursorPos: number;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function expandSnippet(template: string, clipboard: string): ExpandResult {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const replaced = template
    .replace(/\{date\}/g, date)
    .replace(/\{time\}/g, time)
    .replace(/\{datetime\}/g, `${date} ${time}`)
    .replace(/\{clipboard\}/g, clipboard);

  const cursorIdx = replaced.indexOf("{cursor}");
  if (cursorIdx < 0) return { text: replaced, cursorPos: -1 };
  return {
    text: replaced.slice(0, cursorIdx) + replaced.slice(cursorIdx + "{cursor}".length),
    cursorPos: cursorIdx,
  };
}

/** 사용 가능한 변수 토큰 목록 — UI 힌트용. */
export const SNIPPET_VARS = [
  "{date}",
  "{time}",
  "{datetime}",
  "{clipboard}",
  "{cursor}",
] as const;
