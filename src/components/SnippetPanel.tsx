import { useState } from "react";
import type { Snippet } from "../lib/types";
import { expandSnippet, SNIPPET_VARS } from "../lib/snippets";

interface Props {
  snippets: Snippet[];
  /** 직전 클립보드 본문 — {clipboard} 변수 치환에 사용. */
  lastClipboard: string;
  onUse: (text: string) => void;
  onAdd: (snippet: Omit<Snippet, "id">) => void;
  onDelete: (id: string) => void;
}

export function SnippetPanel({ snippets, lastClipboard, onUse, onAdd, onDelete }: Props) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const reset = () => {
    setTitle("");
    setBody("");
    setCreating(false);
  };

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    onAdd({
      title: title.trim(),
      body,
      uses: 0,
      createdAt: Date.now(),
    });
    reset();
  };

  const useSnippet = (s: Snippet) => {
    const result = expandSnippet(s.body, lastClipboard);
    onUse(result.text);
  };

  return (
    <div className="card">
      <div className="panel-header">
        <span className="panel-title">스니펫 ({snippets.length})</span>
        {!creating ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
          >
            + 새 스니펫
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            취소
          </button>
        )}
      </div>

      {creating && (
        <div
          className="snippet"
          style={{ borderColor: "var(--primary)", marginBottom: 12 }}
        >
          <input
            className="input"
            placeholder="제목 (예: 회의록 헤더)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="textarea"
            placeholder="본문… 변수 사용 가능"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ minHeight: 100 }}
          />
          <div className="snippet-vars">
            {SNIPPET_VARS.map((v) => (
              <code
                key={v}
                onClick={() => setBody((b) => b + v)}
                style={{ cursor: "pointer" }}
                title="클릭하여 본문에 추가"
              >
                {v}
              </code>
            ))}
          </div>
          <div className="snippet-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={submit}
              disabled={!title.trim() || !body.trim()}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {snippets.length === 0 && !creating ? (
        <div className="empty-message">
          저장된 스니펫이 없습니다. 위 '+ 새 스니펫' 으로 추가하세요.
        </div>
      ) : (
        <div className="snippet-grid">
          {snippets.map((s) => (
            <div key={s.id} className="snippet">
              <div className="snippet-title">{s.title}</div>
              <div className="snippet-body">{s.body}</div>
              <div className="snippet-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => useSnippet(s)}
                  title="변수 치환 후 클립보드에 복사"
                >
                  사용
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onDelete(s.id)}
                >
                  삭제
                </button>
                <span className="muted" style={{ marginLeft: "auto" }}>
                  {s.uses}회
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
