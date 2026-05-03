// SQLite database — clipboard history + snippets + settings.
//
// 위치: %APPDATA%/com.toolfunhub.clipboard-stash/store.db
//
// 스키마 plan:
//   CREATE TABLE history (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     text TEXT NOT NULL,
//     kind TEXT NOT NULL DEFAULT 'text',
//     source TEXT,
//     created_at INTEGER NOT NULL,
//     used_at INTEGER NOT NULL DEFAULT 0,
//     pin INTEGER NOT NULL DEFAULT 0,
//     tags TEXT NOT NULL DEFAULT '[]'  -- JSON array
//   );
//
//   CREATE VIRTUAL TABLE history_fts USING fts5(
//     text,
//     content='history',
//     content_rowid='id',
//     tokenize='unicode61'
//   );
//
//   CREATE TRIGGER history_ai AFTER INSERT ON history BEGIN
//     INSERT INTO history_fts(rowid, text) VALUES (new.id, new.text);
//   END;
//
//   CREATE TABLE snippets (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     title TEXT NOT NULL,
//     body TEXT NOT NULL,
//     uses INTEGER NOT NULL DEFAULT 0,
//     created_at INTEGER NOT NULL
//   );
//
//   CREATE TABLE settings (
//     key TEXT PRIMARY KEY,
//     value TEXT NOT NULL
//   );
//
// MVP에서는 tauri-plugin-sql 의 frontend SQL API 로 충분. 직접 rusqlite 호출이 필요한
// FTS5 트리거나 마이그레이션은 init() 내에서 처리.

use anyhow::Result;
use tauri::{AppHandle, Manager};

pub async fn init(app: &AppHandle) -> Result<()> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let db_path = dir.join("store.db");
    tracing::info!("DB path: {}", db_path.display());

    // TODO: rusqlite::Connection::open(db_path) 후 마이그레이션 적용.
    // 현재는 plugin-sql 의 자체 init 으로 위임.

    Ok(())
}
