// Clipboard polling — arboard 기반 30ms 주기 폴링.
//
// Windows 기본 클립보드는 변경 알림 API (AddClipboardFormatListener) 가 있지만
// arboard 가 제공하지 않으므로 MVP는 단순 polling. 30ms 면 사용자가 체감 못할 수준이고
// CPU 영향도 idle 시 0.1% 미만.
//
// TODO (Phase 1.x):
//   - 비밀번호 매니저(KeePass, 1Password, Bitwarden) 활성 윈도우 감지 → skip
//   - 이미지 클립보드 지원 (현재는 텍스트만)
//   - 변경 감지 후 frontend 로 emit("clipboard:new", entry)

use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub fn poll_loop(app: AppHandle) {
    let mut clipboard = match arboard::Clipboard::new() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("arboard init failed: {e:#}");
            return;
        }
    };

    let mut last_text = String::new();

    loop {
        std::thread::sleep(Duration::from_millis(30));

        let text = match clipboard.get_text() {
            Ok(t) => t,
            Err(_) => continue,
        };

        if text.is_empty() || text == last_text {
            continue;
        }

        last_text = text.clone();

        // TODO: SQLite insert + emit event
        if let Err(e) = app.emit("clipboard:new", &text) {
            tracing::warn!("emit failed: {e:#}");
        }
    }
}
