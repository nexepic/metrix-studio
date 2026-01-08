mod driver;

use driver::{MetrixDb, QueryResult};
use std::sync::Mutex;
use tauri::{Manager, State, TitleBarStyle};

// --- App State Definition ---
// Holds the database connection thread-safely
struct AppState {
    db: Mutex<Option<MetrixDb>>,
}

// --- Tauri Commands ---

#[tauri::command]
async fn open_database(path: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;

    // Attempt to open the database using the driver
    // Map driver errors to strings for the frontend
    let new_db = MetrixDb::open(&path).map_err(|e| e.to_string())?;

    *db_guard = Some(new_db);
    Ok(format!("Successfully connected to {}", path))
}

#[tauri::command]
async fn run_query(query: String, state: State<'_, AppState>) -> Result<QueryResult, String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;

    if let Some(db) = &*db_guard {
        return db.execute(&query).map_err(|e| e.to_string());
    }

    Err("No database is currently open.".to_string())
}

#[tauri::command]
async fn close_database(state: State<'_, AppState>) -> Result<(), String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;
    *db_guard = None; // Drop the database connection
    Ok(())
}

// --- Main Entry Point (Called by main.rs and Mobile targets) ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 1. Initialize Plugins
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())

        // 2. Initialize State
        .manage(AppState {
            db: Mutex::new(None),
        })

        // 3. Register Commands
        .invoke_handler(tauri::generate_handler![
            open_database,
            run_query,
            close_database
        ])

        // 4. Configure Window (Platform specific UI)
        .setup(|app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}