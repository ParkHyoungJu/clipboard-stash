import { useCallback, useState } from "react";
import type { KeyBinding } from "../lib/types";
import { newId } from "../lib/store";

interface Props {
  binds: KeyBinding[];
  /** 현재 시스템 클립보드 (있으면 가져오기 버튼 활성). */
  lastClipboard: string;
  /** 글로벌 등록/해제 동기화 콜백. */
  onChangeAll: (next: KeyBinding[]) => void;
  /** 글로벌 핫키 등록/해제 결과 메시지. */
  onMessage: (msg: string) => void;
}

export function KeybindPanel({ binds, lastClipboard, onChangeAll, onMessage }: Props) {
  const [draftId, setDraftId] = useState<string | null>(null);

  const startNew = () => {
    const fresh: KeyBinding = {
      id: newId(),
      combo: "",
      text: "",
      label: "",
      global: false,
    };
    onChangeAll([...binds, fresh]);
    setDraftId(fresh.id);
  };

  const updateBind = useCallback(
    (id: string, patch: Partial<KeyBinding>) => {
      onChangeAll(binds.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [binds, onChangeAll]
  );

  const removeBind = useCallback(
    (id: string) => {
      onChangeAll(binds.filter((b) => b.id !== id));
      if (draftId === id) setDraftId(null);
    },
    [binds, draftId, onChangeAll]
  );

  return (
    <div className="kb-panel">
      <div className="kb-intro">
        <h2>🔑 단축키 바인딩</h2>
        <p>
          원하는 키 조합에 자주 쓰는 텍스트를 매핑합니다. 사용자가 키 조합 직접 선택.
        </p>
        <p className="kb-priority">
          <strong>🌍 외부 동작 ON</strong> = 다른 앱 작업 중에도 단축키로 즉시 붙여넣기 (자동 Ctrl+V 포함) ·
          <strong> OFF</strong> = 매니저 창 안에서만 동작 (클립보드 복사만)
        </p>
        <button className="kb-btn-add" onClick={startNew}>+ 새 단축키 추가</button>
      </div>

      {binds.length === 0 ? (
        <div className="kb-empty-state">
          아직 등록된 단축키가 없습니다. 위 "+ 새 단축키 추가" 버튼으로 시작하세요.
        </div>
      ) : (
        <div className="kb-list">
          {binds.map((b) => (
            <KeybindCard
              key={b.id}
              bind={b}
              editing={draftId === b.id}
              lastClipboard={lastClipboard}
              onEdit={() => setDraftId(b.id)}
              onClose={() => setDraftId(null)}
              onUpdate={(patch) => updateBind(b.id, patch)}
              onRemove={() => removeBind(b.id)}
              onMessage={onMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  bind: KeyBinding;
  editing: boolean;
  lastClipboard: string;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (patch: Partial<KeyBinding>) => void;
  onRemove: () => void;
  onMessage: (msg: string) => void;
}

function KeybindCard({
  bind, editing, lastClipboard, onEdit, onClose, onUpdate, onRemove, onMessage,
}: CardProps) {
  const filled = !!bind.combo && !!bind.text;

  const fillFromClipboard = async () => {
    let v = lastClipboard;
    if (!v) {
      try { v = await navigator.clipboard.readText(); } catch { v = ""; }
    }
    if (v) {
      onUpdate({ text: v });
      onMessage("현재 클립보드에서 가져왔습니다");
    }
  };

  return (
    <div className={`kb-card${filled ? " is-filled" : ""}${editing ? " is-editing" : ""}`}>
      <div className="kb-card-row">
        <ComboCapture
          value={bind.combo}
          onChange={(combo) => onUpdate({ combo })}
        />
        <input
          className="kb-input-label"
          type="text"
          placeholder="라벨 (예: 회사 이메일)"
          value={bind.label ?? ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
        <button
          className="kb-btn kb-btn-small kb-btn-clear"
          onClick={onRemove}
          title="이 매핑 삭제"
        >
          ✕
        </button>
      </div>

      <textarea
        className="kb-textarea"
        value={bind.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="이 단축키에 매핑할 텍스트 — 누르면 클립보드로 복사됩니다"
        rows={3}
        onFocus={onEdit}
        onBlur={onClose}
      />

      <div className="kb-card-actions">
        <button className="kb-btn kb-btn-clip" onClick={fillFromClipboard}>
          📋 현재 클립보드에서 가져오기
        </button>

        <label className="kb-toggle" title="ON: 다른 앱 작업 중에도 단축키로 즉시 붙여넣기 (자동 Ctrl+V 포함)">
          <input
            type="checkbox"
            checked={bind.global}
            onChange={(e) => onUpdate({ global: e.target.checked })}
          />
          <span>🌍 외부 동작 (자동 붙여넣기 포함)</span>
        </label>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ComboCapture — 사용자가 키 누르면 그 조합을 캡처해 저장.
   Tauri shortcut format: "Control+Shift+1", "Alt+E" 등.
───────────────────────────────────────────────────────────────────── */

interface ComboProps {
  value: string;
  onChange: (combo: string) => void;
}

function ComboCapture({ value, onChange }: ComboProps) {
  const [recording, setRecording] = useState(false);

  const captureKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const mods: string[] = [];
    if (e.ctrlKey || e.metaKey) mods.push("Control");
    if (e.altKey) mods.push("Alt");
    if (e.shiftKey) mods.push("Shift");

    const k = e.key;
    // modifier 자체만 누른 경우 무시
    if (k === "Control" || k === "Alt" || k === "Shift" || k === "Meta") return;
    if (k === "Escape") {
      setRecording(false);
      return;
    }

    let mainKey = k;
    if (k.length === 1) mainKey = k.toUpperCase();
    else if (k === "ArrowUp") mainKey = "Up";
    else if (k === "ArrowDown") mainKey = "Down";
    else if (k === "ArrowLeft") mainKey = "Left";
    else if (k === "ArrowRight") mainKey = "Right";
    else if (k === " ") mainKey = "Space";

    const combo = [...mods, mainKey].join("+");
    onChange(combo);
    setRecording(false);
  };

  return (
    <div
      className={`kb-combo-capture${recording ? " is-recording" : ""}`}
      tabIndex={0}
      role="button"
      onClick={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      onKeyDown={recording ? captureKey : undefined}
    >
      {recording ? (
        <span className="kb-combo-recording">키 조합을 누르세요... (Esc 취소)</span>
      ) : value ? (
        <span className="kb-combo-display">
          {value.split("+").map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="kb-combo-plus">+</span>}
              <kbd>{part}</kbd>
            </span>
          ))}
        </span>
      ) : (
        <span className="kb-combo-empty">클릭 후 키 조합 입력</span>
      )}
    </div>
  );
}
