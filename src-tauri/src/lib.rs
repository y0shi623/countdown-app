mod timer;
mod tray;

use std::sync::{Arc, Mutex};
use timer::{SharedTimer, TimerState};

pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(TimerState::new())) as SharedTimer)
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            timer::start_timer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
