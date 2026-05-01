# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Tauri v2 desktop countdown timer app (カウントダウンタイマー) with a React 19 + TypeScript + Material-UI frontend and Rust backend. The window is transparent, undecorated (custom title bar), and fixed at 400×319px.

## Commands

```bash
# Start Tauri dev mode (starts Vite dev server + Rust hot-reload)
npm run tauri dev

# Build for production (frontend then Tauri bundle)
npm run tauri build

# Frontend only (Vite dev server at localhost:1420)
npm run dev

# Frontend only build (TypeScript compile + Vite)
npm run build
```

There are no configured lint or test commands.

## Architecture

### Frontend–Backend IPC

The frontend calls Rust commands via `@tauri-apps/api/core` `invoke()`:

| Command | Args | Description |
|---|---|---|
| `start_timer` | `{ minutes, notifyMinutes: [n1, n2] }` | Start countdown, spawn background thread |
| `pause_timer` | — | Pause and save remaining time |
| `resume_timer` | — | Resume from saved time |
| `stop_timer` | — | Reset to idle |

Rust emits events to the frontend via `app_handle.emit()`:

| Event | Payload | Frequency |
|---|---|---|
| `timer_tick` | remaining seconds (`u64`) | every 1 s while running |
| `timer_status` | `"Idle"` \| `"Running"` \| `"Paused"` | on state change |

### Rust Backend (`src-tauri/src/`)

- **`lib.rs`** — Tauri app builder, plugin registration (`single-instance`, `notification`), shared `TimerState` wrapped in `Arc<Mutex<>>`
- **`timer.rs`** — `TimerState` struct, timer thread logic, all IPC command handlers, notification dispatch at configured thresholds
- **`tray.rs`** — System tray icon with Show/Quit menu (Japanese labels), double-click to show window
- **`main.rs`** — Thin binary entry calling `tauri_app_lib::run()`

### Frontend (`src/`)

- **`App.tsx`** — Single `TimerApp` component + `useTimer()` custom hook that owns all timer state and Tauri event listeners
- **`components/NumberFields.tsx`** — MUI-based number input with +/− buttons
- **`Icon.tsx`** — Custom SVG timer icon

### Release

GitHub Actions (`.github/workflows/release-windows.yml`) triggers on `v*` tags, builds on `windows-latest`, and publishes NSIS + MSI installers via `tauri-apps/tauri-action`.
