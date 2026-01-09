use crate::models::QueryResult;
use crate::state::AppState;
use crate::driver::MetrixDB;
use tauri::State;

#[tauri::command]
pub async fn open_database(path: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;
    // Uses the standard 'open' which creates the DB if it doesn't exist
    let new_db = MetrixDB::open(&path).map_err(|e| e.to_string())?;
    *db_guard = Some(new_db);
    Ok(format!("Database created/opened at {}", path))
}

#[tauri::command]
pub async fn connect_existing(path: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;
    // Uses 'open_if_exists' to ensure we don't accidentally create a new DB for invalid paths
    let new_db = MetrixDB::open_if_exists(&path).map_err(|e| e.to_string())?;
    *db_guard = Some(new_db);
    Ok(format!("Connected to existing database at {}", path))
}

#[tauri::command]
pub async fn run_query(query: String, state: State<'_, AppState>) -> Result<QueryResult, String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;

    if let Some(db) = &*db_guard {
        // Map driver result to string error for Tauri
        return db.execute(&query).map_err(|e| e.to_string());
    }

    Err("No database is currently open.".to_string())
}

#[tauri::command]
pub async fn close_database(state: State<'_, AppState>) -> Result<(), String> {
    let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire db lock")?;
    *db_guard = None; // Dropping the MetrixDb struct triggers impl Drop (closing C ptr)
    Ok(())
}