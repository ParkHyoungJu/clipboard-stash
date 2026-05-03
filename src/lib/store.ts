/**
 * localStorage 래퍼 — `tfh_clipboard-stash_*` 키 prefix 일관 적용.
 *
 * 향후 Tauri 빌드에서 SQLite로 교체 시 이 모듈만 어댑터로 갈아끼우면 됨.
 */

import {
  type AppSettings,
  type ClipboardEntry,
  type Snippet,
  DEFAULT_SETTINGS,
} from "./types";

const PREFIX = "tfh_clipboard-stash_";
const KEY_HISTORY = `${PREFIX}history`;
const KEY_SNIPPETS = `${PREFIX}snippets`;
const KEY_SETTINGS = `${PREFIX}settings`;
const KEY_SEEDED = `${PREFIX}seeded`;

/** 최대 보관 항목 수 — 웹 데모는 무료 plan 한도와 별개로 1000개로 제한. */
const HISTORY_LIMIT = 1000;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceeded 등 — silently ignore in MVP
  }
}

/* ─── History ────────────────────────────────────────────────────────── */

export function loadHistory(): ClipboardEntry[] {
  return readJSON<ClipboardEntry[]>(KEY_HISTORY, []);
}

export function saveHistory(entries: ClipboardEntry[]): void {
  writeJSON(KEY_HISTORY, entries.slice(0, HISTORY_LIMIT));
}

/* ─── Snippets ───────────────────────────────────────────────────────── */

export function loadSnippets(): Snippet[] {
  return readJSON<Snippet[]>(KEY_SNIPPETS, []);
}

export function saveSnippets(snippets: Snippet[]): void {
  writeJSON(KEY_SNIPPETS, snippets);
}

/* ─── Settings ───────────────────────────────────────────────────────── */

export function loadSettings(): AppSettings {
  return readJSON<AppSettings>(KEY_SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(s: AppSettings): void {
  writeJSON(KEY_SETTINGS, s);
}

/* ─── Seed flag ──────────────────────────────────────────────────────── */

export function isSeeded(): boolean {
  return localStorage.getItem(KEY_SEEDED) === "1";
}

export function markSeeded(): void {
  try {
    localStorage.setItem(KEY_SEEDED, "1");
  } catch {
    /* noop */
  }
}

/* ─── ID gen ─────────────────────────────────────────────────────────── */

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ─── Keybinds (사용자 정의 단축키 매핑 — 자유 추가) ───────────────────── */

import { type KeyBinding } from "./types";

const KEY_KEYBINDS = `${PREFIX}keybinds_v2`;

export function loadKeybinds(): KeyBinding[] {
  return readJSON<KeyBinding[]>(KEY_KEYBINDS, []);
}

export function saveKeybinds(list: KeyBinding[]): void {
  writeJSON(KEY_KEYBINDS, list);
}
