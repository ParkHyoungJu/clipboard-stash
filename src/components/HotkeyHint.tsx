/**
 * 단축키 힌트 — 웹과 데스크톱 빌드의 키 안내가 다름을 명시.
 */
export function HotkeyHint() {
  return (
    <div className="hotkey-hint" role="note">
      <span>
        <kbd>Alt</kbd>+<kbd>/</kbd> 검색 포커스
      </span>
      <span>
        <kbd>↑</kbd>/<kbd>↓</kbd> 이동
      </span>
      <span>
        <kbd>Enter</kbd> 복사
      </span>
      <span>
        <kbd>Alt</kbd>+<kbd>1~9</kbd> 핀 즉시 복사
      </span>
      <span className="muted">
        · 데스크톱 빌드: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> 글로벌 호출
      </span>
    </div>
  );
}
