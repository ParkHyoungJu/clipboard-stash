import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "./components/ThemeToggle";
import { ClipboardCapture } from "./components/ClipboardCapture";
import { SearchBar } from "./components/SearchBar";
import { HistoryList } from "./components/HistoryList";
import { SnippetPanel } from "./components/SnippetPanel";
import { KeybindPanel } from "./components/KeybindPanel";
import { compileQuery } from "./lib/search";
import {
  loadHistory,
  saveHistory,
  loadSnippets,
  saveSnippets,
  loadSettings,
  saveSettings,
  loadKeybinds,
  saveKeybinds,
  newId,
} from "./lib/store";
import type { ClipboardEntry, KeyBinding, SearchMode, Snippet } from "./lib/types";

type Tab = "history" | "snippets" | "keybinds";

/** KeyboardEvent → Tauri shortcut 형식 ("Control+Shift+1") 변환. modifier만 누른 경우 null. */
function comboFromEvent(e: KeyboardEvent): string | null {
  const k = e.key;
  if (k === "Control" || k === "Alt" || k === "Shift" || k === "Meta") return null;
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push("Control");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (mods.length === 0) return null; // modifier 없으면 글로벌 매핑 아님
  let mainKey = k;
  if (k.length === 1) mainKey = k.toUpperCase();
  else if (k === "ArrowUp") mainKey = "Up";
  else if (k === "ArrowDown") mainKey = "Down";
  else if (k === "ArrowLeft") mainKey = "Left";
  else if (k === "ArrowRight") mainKey = "Right";
  else if (k === " ") mainKey = "Space";
  return [...mods, mainKey].join("+");
}

export default function App() {
  /* State (시드 제거 — 깨끗한 첫 실행) */
  const [history, setHistory] = useState<ClipboardEntry[]>(() => loadHistory());
  const [snippets, setSnippets] = useState<Snippet[]>(() => loadSnippets());
  const [settings, setSettings] = useState(() => loadSettings());
  const [keybinds, setKeybinds] = useState<KeyBinding[]>(() => loadKeybinds());

  const [tab, setTab] = useState<Tab>("history");
  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("text");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const pushDebug = useCallback((line: string) => {
    setDebugLog((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 6));
  }, []);

  /* Persistence */
  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveSnippets(snippets); }, [snippets]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveKeybinds(keybinds); }, [keybinds]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(label);
      window.setTimeout(() => setToast((m) => (m === label ? null : m)), 1800);
    } catch {
      setToast("복사 실패");
      window.setTimeout(() => setToast(null), 1800);
    }
  }, []);

  /* 매핑 lookup: 매니저 창 안 키 핸들러용 (combo 정규화 포함) */
  const findBindByCombo = useCallback((combo: string): KeyBinding | undefined => {
    return keybinds.find((b) => b.combo === combo);
  }, [keybinds]);

  /* Toast */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 1800);
  }, []);

  /* Query compile */
  const query = useMemo(
    () => compileQuery(searchQ, searchMode),
    [searchQ, searchMode]
  );

  /* Filtered + sorted */
  const sortedFiltered = useMemo(() => {
    const filtered = query.raw.trim()
      ? history.filter((e) => query.matches(e.text))
      : history;
    const pinned = filtered.filter((e) => e.pin > 0).sort((a, b) => a.pin - b.pin);
    const rest = filtered
      .filter((e) => e.pin === 0)
      .sort((a, b) => b.createdAt - a.createdAt);
    return [...pinned, ...rest];
  }, [history, query]);

  /* Add */
  const addEntry = useCallback((text: string, source = "auto") => {
    setHistory((prev) => {
      const trimmed = text.trim();
      if (!trimmed) return prev;
      const dupIdx = prev.findIndex((e) => e.text === trimmed);
      if (dupIdx >= 0) {
        const updated = [...prev];
        const [item] = updated.splice(dupIdx, 1);
        return [{ ...item, createdAt: Date.now() }, ...updated];
      }
      const entry: ClipboardEntry = {
        id: newId(),
        text: trimmed,
        kind: "text",
        source,
        createdAt: Date.now(),
        tags: [],
        pin: 0,
        usedAt: 0,
      };
      return [entry, ...prev];
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setHistory((prev) => {
      const target = prev.find((e) => e.id === id);
      if (!target) return prev;
      if (target.pin > 0) {
        return prev.map((e) => (e.id === id ? { ...e, pin: 0 } : e));
      }
      const used = new Set(prev.filter((e) => e.pin > 0).map((e) => e.pin));
      let slot = 0;
      for (let i = 1; i <= 9; i++) {
        if (!used.has(i)) { slot = i; break; }
      }
      if (slot === 0) {
        showToast("핀 슬롯(1~9)이 모두 사용 중입니다");
        return prev;
      }
      return prev.map((e) => (e.id === id ? { ...e, pin: slot } : e));
    });
  }, [showToast]);

  const copyEntry = useCallback(
    async (entry: ClipboardEntry) => {
      try {
        await navigator.clipboard.writeText(entry.text);
        setHistory((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, usedAt: Date.now() } : e))
        );
        showToast("복사됨");
      } catch {
        showToast("복사 실패");
      }
    },
    [showToast]
  );

  const useSnippetText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("스니펫 복사됨");
      } catch {
        showToast("복사 실패");
      }
      addEntry(text, "snippet");
    },
    [addEntry, showToast]
  );

  const addSnippet = useCallback((s: Omit<Snippet, "id">) => {
    setSnippets((prev) => [{ ...s, id: newId() }, ...prev]);
  }, []);

  const deleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* Keyboard nav */
  const moveSelection = useCallback(
    (dir: 1 | -1) => {
      if (sortedFiltered.length === 0) return;
      const idx = sortedFiltered.findIndex((e) => e.id === selectedId);
      let next = idx + dir;
      if (next < 0) next = 0;
      if (next >= sortedFiltered.length) next = sortedFiltered.length - 1;
      setSelectedId(sortedFiltered[next]?.id ?? null);
    },
    [selectedId, sortedFiltered]
  );

  const copySelection = useCallback(() => {
    const target =
      sortedFiltered.find((e) => e.id === selectedId) ?? sortedFiltered[0];
    if (target) copyEntry(target);
  }, [copyEntry, selectedId, sortedFiltered]);

  /* Global key bindings */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt+/ 검색 포커스
      if (e.altKey && !e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      // 사용자 매핑 우선 — 모든 modifier 조합 시도 (매니저 창 포커스 시)
      const localCombo = comboFromEvent(e);
      if (localCombo) {
        const mapped = findBindByCombo(localCombo);
        if (mapped) {
          e.preventDefault();
          copyText(mapped.text, `복사됨 (${mapped.label || mapped.combo})`);
          return;
        }
      }
      // Alt+1~9 fallback = 핀 슬롯
      if (e.altKey && !e.ctrlKey && /^[1-9]$/.test(e.key)) {
        const slot = Number(e.key);
        const target = history.find((x) => x.pin === slot);
        if (target) {
          e.preventDefault();
          copyEntry(target);
        }
        return;
      }
      // Ctrl+1~9 fallback = 화면 표시 순서
      if (e.ctrlKey && !e.altKey && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const target = sortedFiltered[idx];
        if (target) {
          e.preventDefault();
          copyEntry(target);
        }
        return;
      }
      // ↑↓ 글로벌 (textarea/input 안 제외) — 검색바 밖에서도 항목 이동
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        moveSelection(e.key === "ArrowDown" ? 1 : -1);
        return;
      }
      // Enter 글로벌 (textarea/input/button 안 제외) — 선택 항목 복사
      if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        copySelection();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [copyEntry, copySelection, copyText, findBindByCombo, history, moveSelection, sortedFiltered]);

  /* === Tauri 글로벌 핫키 등록 — global=true 인 매핑만 OS 레벨로 === */
  useEffect(() => {
    let cancelled = false;
    let registeredKeys: string[] = [];

    (async () => {
      try {
        const gs = await import("@tauri-apps/plugin-global-shortcut");
        // 이전 세션 등록 모두 해제
        try { await gs.unregisterAll(); } catch { /* noop */ }

        const targets = keybinds.filter((b) => b.global && b.combo && b.text);
        for (const b of targets) {
          if (cancelled) break;
          try {
            await gs.register(b.combo, async (event: { state?: string } | undefined) => {
              if (event && event.state && event.state !== "Pressed") return;
              const stage: string[] = [];

              // 1. 매니저 창이 떠 있으면 hide → OS가 직전 활성 창(메모장 등)으로 포커스 복귀
              try {
                const { getCurrentWindow } = await import("@tauri-apps/api/window");
                const win = getCurrentWindow();
                if (await win.isVisible()) {
                  await win.hide();
                  await new Promise((r) => setTimeout(r, 30));
                  stage.push("hide✓");
                }
              } catch (e) {
                stage.push(`hide✗(${String(e).slice(0, 20)})`);
              }

              // 2. 클립보드 set — Rust 측 set_clipboard (webview hide 상태에서도 안전)
              try {
                const { invoke } = await import("@tauri-apps/api/core");
                await invoke("set_clipboard", { text: b.text });
                stage.push("clipboard✓");
              } catch (e) {
                stage.push(`clipboard✗(${String(e).slice(0, 30)})`);
                pushDebug(`[${b.combo}] ${stage.join(" ")}`);
                return;
              }

              // 3. 자동 Ctrl+V 시뮬레이션
              try {
                const { invoke } = await import("@tauri-apps/api/core");
                const r = await invoke<string>("auto_paste");
                stage.push(`paste✓ ${r ?? ""}`);
              } catch (e) {
                stage.push(`paste✗(${String(e).slice(0, 60)})`);
              }

              const summary = `[${b.combo}] ${stage.join(" ")}`;
              pushDebug(summary);
              // eslint-disable-next-line no-console
              console.log("[clipboard-stash trigger]", b.combo, stage);
            });
            registeredKeys.push(b.combo);
          } catch (e) {
            // 등록 실패 (충돌 등) — 무시 후 진행
            // eslint-disable-next-line no-console
            console.warn(`Failed to register ${b.combo}:`, e);
          }
        }
      } catch {
        // Tauri 환경 아니면 무시 (웹 데모)
      }
    })();

    return () => {
      cancelled = true;
      (async () => {
        try {
          const gs = await import("@tauri-apps/plugin-global-shortcut");
          for (const k of registeredKeys) {
            try { await gs.unregister(k); } catch { /* noop */ }
          }
        } catch { /* noop */ }
      })();
    };
  }, [keybinds, pushDebug, showToast]);

  /* Tauri 자동 클립보드 폴링 listener */
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen<string>("clipboard:new", (event) => {
          if (typeof event.payload === "string") {
            addEntry(event.payload, "auto");
          }
        });
      } catch {
        // Tauri 환경 아니면 무시 (웹 데모)
      }
    })();
    return () => { unlisten?.(); };
  }, [addEntry]);

  /* 첫 진입 — 검색바 자동 포커스 */
  useEffect(() => {
    const t = window.setTimeout(() => searchRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, []);

  const lastClipboard = history[0]?.text ?? "";
  const onboarding = history.length === 0 && tab === "history";

  return (
    <div id="app" className="dt-root">
      <header className="dt-header">
        <div className="dt-title">
          <span className="dt-icon" aria-hidden>📋</span>
          <span className="dt-name">Clipboard Stash</span>
          <span className="dt-version">v0.1.0</span>
        </div>
        <div className="dt-hotkeys" aria-label="단축키">
          <span><kbd>Alt</kbd>+<kbd>/</kbd> 검색</span>
          <span><kbd>↑↓</kbd> · <kbd>Enter</kbd></span>
          <span><kbd>Ctrl</kbd>+<kbd>1~9</kbd> 즉시 복사</span>
          <span><kbd>Alt</kbd>+<kbd>1~9</kbd> ★핀</span>
          <span className="dt-hk-global"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> 호출</span>
        </div>
        <div className="dt-actions">
          <label className="dt-mask">
            <input
              type="checkbox"
              checked={settings.maskEnabled}
              onChange={(e) =>
                setSettings({ ...settings, maskEnabled: e.target.checked })
              }
            />
            <span>마스킹</span>
          </label>
          <ThemeToggle />
        </div>
      </header>

      <main className="dt-main">
        <div className="dt-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "history"}
            className={`dt-tab${tab === "history" ? " is-active" : ""}`}
            onClick={() => setTab("history")}
          >
            📋 히스토리 <span className="dt-count">{history.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "snippets"}
            className={`dt-tab${tab === "snippets" ? " is-active" : ""}`}
            onClick={() => setTab("snippets")}
          >
            📝 스니펫 <span className="dt-count">{snippets.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "keybinds"}
            className={`dt-tab${tab === "keybinds" ? " is-active" : ""}`}
            onClick={() => setTab("keybinds")}
          >
            🔑 단축키 <span className="dt-count">{keybinds.length}</span>
          </button>
          <div className="dt-tab-spacer" />
          {tab === "history" && history.length > 0 && (
            <button
              className="dt-clear"
              onClick={() => {
                if (confirm("모든 히스토리를 삭제할까요? 핀 항목 포함.")) {
                  setHistory([]);
                  showToast("히스토리 삭제됨");
                }
              }}
            >
              전체 삭제
            </button>
          )}
        </div>

        {tab === "history" ? (
          <>
            <SearchBar
              ref={searchRef}
              query={searchQ}
              mode={searchMode}
              error={query.error}
              onQueryChange={setSearchQ}
              onModeChange={setSearchMode}
              onArrow={moveSelection}
              onEnter={copySelection}
            />

            {onboarding ? (
              <div className="dt-onboarding">
                <h2>👋 어떻게 사용하나요?</h2>
                <ol>
                  <li><strong>다른 앱에서 텍스트 복사</strong>(Ctrl+C) → 자동으로 여기 추가됩니다.</li>
                  <li><kbd>Alt</kbd>+<kbd>/</kbd> 로 검색 시작 — 텍스트·정규식·자모(ㅎㄱ→한국).</li>
                  <li><strong>즉시 복사 단축키</strong>: 화면 위 1~9번 항목은 <kbd>Ctrl</kbd>+<kbd>1</kbd> ~ <kbd>Ctrl</kbd>+<kbd>9</kbd> 한 번에. 일반 이동은 <kbd>↑↓</kbd> + <kbd>Enter</kbd>.</li>
                  <li>★ 핀 박은 항목은 <kbd>Alt</kbd>+<kbd>1</kbd> ~ <kbd>Alt</kbd>+<kbd>9</kbd> (사용자가 지정한 핀 번호).</li>
                  <li>복사 후 <strong>다른 앱에서 Ctrl+V</strong> 로 붙여넣기. X 버튼은 트레이로 숨김, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> 로 어디서든 호출.</li>
                </ol>
                <div className="dt-onboarding-tip">
                  💡 또는 직접 텍스트를 붙여넣어 추가:
                </div>
                <ClipboardCapture onAdd={(t) => addEntry(t, "manual")} />
              </div>
            ) : (
              <>
                <ClipboardCapture onAdd={(t) => addEntry(t, "manual")} />
                <HistoryList
                  entries={history}
                  query={query}
                  selectedId={selectedId}
                  maskEnabled={settings.maskEnabled}
                  onSelect={setSelectedId}
                  onCopy={copyEntry}
                  onTogglePin={togglePin}
                  onDelete={deleteEntry}
                />
              </>
            )}
          </>
        ) : tab === "snippets" ? (
          <SnippetPanel
            snippets={snippets}
            lastClipboard={lastClipboard}
            onUse={useSnippetText}
            onAdd={addSnippet}
            onDelete={deleteSnippet}
          />
        ) : (
          <KeybindPanel
            binds={keybinds}
            lastClipboard={lastClipboard}
            onChangeAll={setKeybinds}
            onMessage={showToast}
          />
        )}
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}

      <div className="dt-debug" role="log">
        <div className="dt-debug-head">
          <span>🔍 단축키 동작 로그 ({debugLog.length})</span>
          <button className="dt-debug-clear" onClick={() => setDebugLog([])}>지우기</button>
        </div>
        {debugLog.length === 0 ? (
          <div className="dt-debug-line" style={{ color: "#a5b4fc" }}>
            (아직 단축키 동작 없음 — 글로벌 ON 매핑된 키를 외부에서 눌러보세요)
          </div>
        ) : (
          debugLog.map((line, i) => (
            <div key={i} className="dt-debug-line">{line}</div>
          ))
        )}
      </div>
    </div>
  );
}
