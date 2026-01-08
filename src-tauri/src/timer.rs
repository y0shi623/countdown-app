use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use tauri::{AppHandle, Emitter, State};
use tauri_plugin_notification::NotificationExt;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
enum TimerStatus {
    Idle,      // 未開始
    Running,   // 実行中
    Paused,    // 一時停止
}


/// タイマー状態
pub struct TimerState {
    status: TimerStatus,
    end_at: Option<Instant>,     // Running 時のみ有効
    remaining: u64,              // 秒（Paused / 再開用）
    notify_at: Vec<u64>,
    notified: HashSet<u64>,
}

impl TimerState {
    pub fn new() -> Self {
        Self {
            status: TimerStatus::Idle,
            end_at: None,
            remaining: 0,
            notify_at: Vec::new(),
            notified: HashSet::new(),
        }
    }
}

fn emit_status(app: &AppHandle, status: TimerStatus) {
    app.emit("timer_status", status).ok();
}
fn emit_tick(app: &AppHandle, tick: u64) {
    app.emit("timer_tick", tick).ok();
}

fn send_notification(app: &AppHandle, body: impl Into<String>) {
    let _ = app.notification()
        .builder()
        .title("カウントダウンタイマー")
        .body(body)
        .show();
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

    {
        let mut timer = state.lock().unwrap();
        timer.status = TimerStatus::Running;
        timer.remaining = total_seconds;
        timer.end_at = Some(Instant::now() + Duration::from_secs(total_seconds));
        timer.notify_at = notify_minutes.into_iter().map(|m| m * 60).collect();
        timer.notified.clear();
    }

    emit_status(&app, TimerStatus::Running);

    let shared = state.inner().clone();

    // ★ 最初の tick
    {
        let timer = shared.lock().unwrap();
        let remaining = timer
            .end_at
            .unwrap()
            .saturating_duration_since(Instant::now())
            .as_secs();

        emit_tick(&app,remaining);
    }

    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));

            let mut timer = shared.lock().unwrap();

            if timer.status != TimerStatus::Running {
                continue;
            }

            let end_at = match timer.end_at {
                Some(t) => t,
                None => continue,
            };

            let remaining = end_at
                .saturating_duration_since(Instant::now())
                .as_secs();

            timer.remaining = remaining;

            emit_tick(&app,remaining);
            let notify_list = timer.notify_at.clone();

            for notify_sec in notify_list {
                if remaining <= notify_sec && !timer.notified.contains(&notify_sec) {
                    let min = notify_sec / 60;

                    send_notification(&app,format!("残り {} 分", min));

                    timer.notified.insert(notify_sec);
                }
            }

            if remaining == 0 {
                timer.status = TimerStatus::Idle;
                send_notification(&app, "時間になりました！");
                    
                timer.end_at = None;
                emit_tick(&app, remaining);
                emit_status(&app, TimerStatus::Idle);
                break;
            }
        }
    });
}

#[tauri::command]
pub fn pause_timer(app: AppHandle,state: State<SharedTimer>) {
    let mut timer = state.lock().unwrap();

    if timer.status != TimerStatus::Running {
        return;
    }

    if let Some(end_at) = timer.end_at {
        timer.remaining = end_at
            .saturating_duration_since(Instant::now())
            .as_secs();
    }

    timer.end_at = None;
    timer.status = TimerStatus::Paused;
    emit_status(&app, TimerStatus::Paused);
}

#[tauri::command]
pub fn resume_timer(app: AppHandle,state: State<SharedTimer>) {
    let mut timer = state.lock().unwrap();

    if timer.status != TimerStatus::Paused {
        return;
    }

    timer.end_at = Some(Instant::now() + Duration::from_secs(timer.remaining));
    timer.status = TimerStatus::Running;
    emit_status(&app, TimerStatus::Running);
}

#[tauri::command]
pub fn stop_timer(state: State<SharedTimer>, app: AppHandle) {
    let mut timer = state.lock().unwrap();

    timer.status = TimerStatus::Idle;
    timer.end_at = None;
    timer.remaining = 0;
    timer.notified.clear();

    emit_tick(&app,0u64);
    emit_status(&app, TimerStatus::Idle);
}

