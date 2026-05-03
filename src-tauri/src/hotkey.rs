// Global hotkey — Ctrl+Shift+V 만 매니저 창 toggle 처리.
// 사용자 매핑 단축키는 frontend(React)가 register 한 별도 callback에서 처리하므로
// 이 글로벌 handler는 Ctrl+Shift+V 외에는 그냥 통과시킨다 (매니저 창 안 띄움).

use anyhow::Result;
use tauri::{App, Manager};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutEvent, ShortcutState,
};

pub fn register_default(app: &App) -> Result<()> {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);
    app.global_shortcut()
        .register(shortcut)
        .map_err(|e| anyhow::anyhow!("global_shortcut register failed: {e}"))?;
    tracing::info!("Registered global shortcut: Ctrl+Shift+V (manager toggle)");
    Ok(())
}

pub fn on_shortcut<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    shortcut: &Shortcut,
    event: ShortcutEvent,
) {
    if event.state() != ShortcutState::Pressed {
        return;
    }

    // Ctrl+Shift+V 만 매니저 창 toggle. 다른 사용자 매핑 단축키는 무시 (frontend callback이 처리).
    let toggle = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);
    if shortcut != &toggle {
        return;
    }

    if let Some(win) = app.get_webview_window("main") {
        let visible = win.is_visible().unwrap_or(false);
        if visible {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.unminimize();
            let _ = win.set_focus();
        }
    }
}
