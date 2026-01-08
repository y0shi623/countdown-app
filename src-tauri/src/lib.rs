mod timer;
mod tray;

use std::sync::{Arc, Mutex};
use timer::{SharedTimer, TimerState};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            // 2重起動されたときの挙動
            if let Some(w) = app.get_webview_window("main") {
                w.show().ok();
                w.set_focus().ok();
            }
        }))
        .manage(Arc::new(Mutex::new(TimerState::new())) as SharedTimer)
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![timer::start_timer,timer::pause_timer, timer::resume_timer, timer::stop_timer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
