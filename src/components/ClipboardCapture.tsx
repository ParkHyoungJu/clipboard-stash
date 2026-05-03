import { useState } from "react";

interface Props {
  onAdd: (text: string) => void;
}

/**
 * 수동 입력으로 항목 추가 — 데스크톱 빌드에서는 OS 클립보드 폴링이 자동으로 채움.
 * 웹에서는 브라우저 보안 이슈로 백그라운드 폴링이 어렵기 때문에 사용자가 직접 추가.
 *
 * "현재 클립보드 읽기" 버튼은 navigator.clipboard.readText() 시도 — 사용자 권한 prompt 발생.
 */
export function ClipboardCapture({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const trimmed = text.replace(/\s+$/, "");
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
    setErr(null);
  };

  const readNow = async () => {
    setBusy(true);
    setErr(null);
    try {
      // 사용자 제스처 + permission 필요. 일부 브라우저(Firefox)는 미지원.
      const t = await navigator.clipboard.readText();
      if (t) {
        onAdd(t);
        setText("");
      } else {
        setErr("클립보드가 비어있습니다.");
      }
    } catch (e) {
      setErr(
        "브라우저에서 클립보드 읽기가 거부되었습니다. 텍스트를 직접 붙여넣어 추가하세요."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" aria-labelledby="capture-title">
      <div className="panel-header">
        <span id="capture-title" className="panel-title">
          새 항목 추가
        </span>
        <span className="muted">
          웹 데모는 수동 추가 · 데스크톱 앱은 OS 클립보드 자동 폴링
        </span>
      </div>
      <textarea
        className="textarea"
        placeholder="텍스트를 붙여넣고 추가 버튼을 눌러주세요. (Ctrl/Cmd+Enter)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        aria-label="클립보드 항목 입력"
      />
      <div className="capture-row">
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={!text.trim()}>
          추가 <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={readNow}
          disabled={busy}
          title="브라우저 권한 prompt 발생 가능"
        >
          {busy ? "읽는 중…" : "현재 클립보드 읽기"}
        </button>
        {err && (
          <span className="status-badge is-warn" role="status">
            {err}
          </span>
        )}
      </div>
    </section>
  );
}
