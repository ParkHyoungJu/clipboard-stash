// Clipboard Stash — Tauri 2.x library entry.

mod clipboard;
mod db;
mod hotkey;
mod paste;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "clipboard_stash=info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(hotkey::on_shortcut)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![paste::auto_paste, paste::set_clipboard])
        .setup(|app| {
            // 1. SQLite 초기화
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init(&app_handle).await {
                    tracing::error!("DB init failed: {e:#}");
                }
            });

            // 2. 글로벌 핫키 (Ctrl+Shift+V)
            hotkey::register_default(app)?;

            // 3. 트레이 아이콘 + 메뉴
            let show_i = MenuItem::with_id(app, "show", "열기 / 숨기기", true, None::<&str>)?;
            let help_i = MenuItem::with_id(app, "help", "사용법 안내", true, None::<&str>)?;
            let about_i = MenuItem::with_id(app, "about", "정보 / 버전", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &help_i, &about_i, &separator, &quit_i])?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().cloned().unwrap())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Clipboard Stash\n좌클릭: 열기/닫기 · 우클릭: 메뉴")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => toggle_main(app),
                    "help" => {
                        show_main(app);
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.eval(
                                "alert('Clipboard Stash 사용법\n\n[자동 수집]\n• 다른 앱에서 Ctrl+C 로 복사 → 자동으로 매니저에 추가\n\n[즉시 복사]\n• Ctrl+1~9 → 화면 위 1~9번째 항목 즉시 복사\n• Alt+1~9 → ★ 핀 박은 항목 즉시 복사\n• ↑↓ + Enter → 선택 항목 복사\n\n[검색]\n• Alt+/ → 검색바 포커스\n• 모드: 텍스트 / 정규식 / 자모(ㅎㄱ→한국)\n\n[글로벌]\n• Ctrl+Shift+V → 어디서든 매니저 호출\n\n[종료]\n• X = 트레이 숨김 / 트레이 우클릭 → 종료 = 완전 종료');"
                            );
                        }
                    }
                    "about" => {
                        show_main(app);
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.eval(
                                "alert('Clipboard Stash v0.1.0 (Beta)\n\nWin+V 정면 대체 6MB Tauri 클립보드 매니저\n\n© 2026 ToolFunHub\nhttps://toolfunhub.com');"
                            );
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    // 좌클릭 (Up) — 토글
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => toggle_main(tray.app_handle()),
                    // 더블클릭 — 항상 열기
                    TrayIconEvent::DoubleClick {
                        button: MouseButton::Left,
                        ..
                    } => show_main(tray.app_handle()),
                    _ => {}
                })
                .build(app)?;

            // 4. X 버튼 → 트레이로 숨김
            if let Some(win) = app.get_webview_window("main") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_clone.hide();
                    }
                });
            }

            // 5. 클립보드 자동 폴링 시작 (clipboard.rs 가 emit("clipboard:new", text))
            let app_clone = app.handle().clone();
            std::thread::spawn(move || {
                clipboard::poll_loop(app_clone);
            });

            // 6. 첫 실행 — 메인 창 표시 (alert 없이, React onboarding 이 안내)
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_main<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

fn toggle_main<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
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
