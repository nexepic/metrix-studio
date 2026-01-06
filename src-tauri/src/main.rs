#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod driver;

use std::sync::Mutex;
use tauri::{State, Manager};
use driver::{MetrixDb, QueryResult};
use log::info;

struct AppState {
    db: Mutex<Option<MetrixDb>>,
}

#[tauri::command]
async fn open_database(path: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire lock")?;
    let new_db = MetrixDb::open(&path)?;
    *db_guard = Some(new_db);
    Ok(format!("Successfully connected to {}", path))
}

#[tauri::command]
async fn run_query(query: String, state: State<'_, AppState>) -> Result<QueryResult, String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to acquire lock")?;
    if let Some(db) = &*db_guard {
        return db.execute(&query);
    }
    Err("No database is currently open.".to_string())
}

#[tauri::command]
async fn close_database(state: State<'_, AppState>) -> Result<(), String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire lock")?;
    *db_guard = None;
    Ok(())
}

fn main() {
    // Initialize env_logger with a default filter of 'info'.
    // This allows hiding 'debug' and 'trace' logs unless requested via RUST_LOG env var.
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Metrix Studio Backend starting...");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState { db: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![
            open_database,
            run_query,
            close_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}