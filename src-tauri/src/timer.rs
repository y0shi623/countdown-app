use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use tauri::{AppHandle, Emitter, State};
use tauri_plugin_notification::NotificationExt;

/// タイマー状態
pub struct TimerState {
    end_at: Option<Instant>,
    notify_at: Vec<u64>,
    notified: HashSet<u64>,
}

impl TimerState {
    pub fn new() -> Self {
        Self {
            end_at: None,
            notify_at: Vec::new(),
            notified: HashSet::new(),
        }
    }
}

pub type SharedTimer = Arc<Mutex<TimerState>>;

#[tauri::command]
pub fn start_timer(
    minutes: u64,
    notify_minutes: Vec<u64>,
    state: State<SharedTimer>,
    app: AppHandle,
) {
    let total_seconds = minutes * 60;
    let notify_seconds: Vec<u64> = notify_minutes.into_iter().map(|m| m * 60).collect();

    {
        let mut timer = state.lock().unwrap();
        timer.end_at = Some(Instant::now() + Duration::from_secs(total_seconds));
        timer.notify_at = notify_seconds;
        timer.notified.clear();
    }

    // ★ ここが重要：Arc を clone
    let shared = state.inner().clone();

    // ★ 最初の tick
    {
        let timer = shared.lock().unwrap();
        let remaining = timer
            .end_at
            .unwrap()
            .saturating_duration_since(Instant::now())
            .as_secs();

        app.emit("timer_tick", remaining).ok();
    }

    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));

            let mut timer = shared.lock().unwrap();

            let end_at = match timer.end_at {
                Some(t) => t,
                None => break,
            };

            let remaining = end_at.saturating_duration_since(Instant::now()).as_secs();

            // ★ notify_at を先に clone（E0502対策）
            let notify_list = timer.notify_at.clone();

            for notify_sec in notify_list {
                if remaining <= notify_sec && !timer.notified.contains(&notify_sec) {
                    let min = notify_sec / 60;

                    app.notification()
                        .builder()
                        .title("カウントダウンタイマー")
                        .body(format!("残り {} 分", min))
                        .show()
                        .ok();

                    timer.notified.insert(notify_sec);
                }
            }

            if remaining == 0 {
                app.notification()
                    .builder()
                    .title("カウントダウンタイマー")
                    .body("時間になりました！")
                    .show()
                    .ok();

                timer.end_at = None;
                app.emit("timer_tick", 0u64).ok();
                break;
            }

            app.emit("timer_tick", remaining).ok();
        }
    });
}
