/**
 * 검색 — 3가지 모드 (text · regex · jamo).
 *
 * 모든 모드는 `(entry: T) => boolean` 술어와 `(text) => Range[]` 하이라이트 위치를 함께 제공.
 * 하이라이트는 단순 substring/Regex 매치 위치 사용.
 */

import type { SearchMode } from "./types";
import { decompose } from "./jamo";

export interface Range {
  start: number;
  end: number;
}

export interface CompiledQuery {
  raw: string;
  mode: SearchMode;
  matches: (text: string) => boolean;
  ranges: (text: string) => Range[];
  /** regex 컴파일 실패 시 사유. 정상이면 null. */
  error: string | null;
}

const EMPTY: CompiledQuery = {
  raw: "",
  mode: "text",
  matches: () => true,
  ranges: () => [],
  error: null,
};

export function compileQuery(raw: string, mode: SearchMode): CompiledQuery {
  if (!raw.trim()) return EMPTY;

  if (mode === "regex") {
    let re: RegExp | null = null;
    try {
      re = new RegExp(raw, "gi");
    } catch (err) {
      return {
        raw,
        mode,
        matches: () => false,
        ranges: () => [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
    return {
      raw,
      mode,
      error: null,
      matches: (text) => {
        re!.lastIndex = 0;
        return re!.test(text);
      },
      ranges: (text) => {
        re!.lastIndex = 0;
        const out: Range[] = [];
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = re!.exec(text)) !== null && guard++ < 500) {
          if (m[0].length === 0) {
            re!.lastIndex++;
            continue;
          }
          out.push({ start: m.index, end: m.index + m[0].length });
        }
        return out;
      },
    };
  }

  if (mode === "jamo") {
    const qd = decompose(raw);
    if (!qd) return EMPTY;
    return {
      raw,
      mode,
      error: null,
      matches: (text) => decompose(text).includes(qd),
      // 한글 자모 단계의 위치를 원문에 정확 매핑하려면 인덱스 추적이 필요.
      // MVP에서는 실패해도 lowercased substring 시도로 대략 강조.
      ranges: (text) => substringRanges(text.toLowerCase(), raw.toLowerCase()),
    };
  }

  // text mode — case-insensitive substring
  const needle = raw.toLowerCase();
  return {
    raw,
    mode,
    error: null,
    matches: (text) => text.toLowerCase().includes(needle),
    ranges: (text) => substringRanges(text.toLowerCase(), needle),
  };
}

function substringRanges(haystack: string, needle: string): Range[] {
  if (!needle) return [];
  const out: Range[] = [];
  let from = 0;
  let guard = 0;
  while (guard++ < 500) {
    const i = haystack.indexOf(needle, from);
    if (i < 0) break;
    out.push({ start: i, end: i + needle.length });
    from = i + needle.length;
  }
  return out;
}
