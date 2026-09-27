mod utils;
use utils::{music, db, commands};

use tauri::Manager;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("no app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();

            let audio_handle = music::spawn_audio_thread();
            app.manage(audio_handle.clone());
            app.manage(commands::CurrentSong(Mutex::new(None)));

            tauri::async_runtime::block_on(async {
                let pool = db::init_db(&app_data_dir).await.expect("db init failed");
                app.manage(pool);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::play_song,
            commands::pause_song,
            commands::resume_song,
            commands::set_volume,
            commands::seek_song,
            commands::get_progress,
            commands::play_song_from_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}