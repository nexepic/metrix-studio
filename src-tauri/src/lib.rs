mod models;
mod driver;
mod state;
mod commands;

use state::AppState;
use std::sync::Mutex;
use tauri::{Manager, TitleBarStyle};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 1. Plugins
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())

        // 2. State Management
        .manage(AppState {
            db: Mutex::new(None),
        })

        // 3. Register Commands (Imported from commands module)
        .invoke_handler(tauri::generate_handler![
            commands::open_database,
            commands::connect_existing,
            commands::run_query,
            commands::close_database
        ])

        // 4. Window Setup (UI Configuration)
        // .setup(|app| {
        //     let window = app.get_webview_window("main").unwrap();
        //
        //     #[cfg(target_os = "macos")]
        //     {
        //         // MacOS: Transparent background + Native Traffic Lights
        //         window.set_title_bar_style(TitleBarStyle::Overlay).unwrap();
        //         window.set_decorations(true).unwrap();
        //         window.set_shadow(false).unwrap();
        //     }
        //
        //     #[cfg(not(target_os = "macos"))]
        //     {
        //         // Windows: Frameless
        //         window.set_decorations(false).unwrap();
        //         window.set_shadow(true).unwrap();
        //     }
        //
        //     Ok(())
        // })

        .setup(|app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}