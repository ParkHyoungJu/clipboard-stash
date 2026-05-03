/**
 * Clipboard Stash — domain types.
 *
 * 웹 데모와 향후 Tauri 백엔드(SQLite)가 같은 타입을 공유하도록 설계.
 * 데스크톱 앱에서는 `source`가 활성 윈도우 프로세스명으로 채워지고,
 * 웹에서는 항상 "browser".
 */

export type ClipboardKind = "text" | "image" | "files";

/** 클립보드 히스토리 항목 한 개. */
export interface ClipboardEntry {
  /** UUID-ish (crypto.randomUUID 또는 timestamp + rand). */
  id: string;
  /** 본문 (image/files 일 경우 메타 URL · 경로 텍스트). */
  text: string;
  /** 콘텐츠 종류. MVP는 text만. */
  kind: ClipboardKind;
  /** 출처 — 웹: "browser", 데스크톱: 프로세스명 (예: "Code.exe"). */
  source: string;
  /** ms epoch */
  createdAt: number;
  /** 사용자 태그. */
  tags: string[];
  /** 핀 번호 (1~9). 없으면 0. */
  pin: number;
  /** 마지막 사용 시각 (ms epoch). 0 = 미사용. */
  usedAt: number;
}

/** 즐겨찾기 스니펫. 변수 자리표시자 포함 가능: {date} {time} {clipboard} {cursor}. */
export interface Snippet {
  id: string;
  title: string;
  body: string;
  /** 사용 횟수 — 정렬에 활용. */
  uses: number;
  createdAt: number;
}

export type SearchMode = "text" | "regex" | "jamo";

export interface AppSettings {
  /** 마스킹 활성화. */
  maskEnabled: boolean;
  /** 자동 폴링 주기 (Tauri 전용). 웹에서는 무시. */
  pollIntervalMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  maskEnabled: true,
  pollIntervalMs: 30,
};

/** 사용자 정의 단축키 매핑 1개. */
export interface KeyBinding {
  id: string;
  /** Tauri shortcut 형식: "Control+Shift+1", "Alt+E" 등. 표시도 동일 사용. */
  combo: string;
  /** 매핑된 텍스트. */
  text: string;
  /** 라벨 (선택, 사용자가 알아보기 쉽게). */
  label?: string;
  /**
   * OS 글로벌 등록 여부 (외부 앱 작업 중에도 동작).
   * ON: 어디서든 단축키 → 클립보드 + 자동 Ctrl+V (즉시 붙여넣기까지)
   * OFF: 매니저 창 안에서만 → 클립보드에만 복사
   */
  global: boolean;
}
