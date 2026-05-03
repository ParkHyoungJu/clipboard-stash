// Clipboard Stash — Tauri 2.x binary entry point.
// 실제 로직은 lib.rs 의 run() 에서.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    clipboard_stash_lib::run()
}
