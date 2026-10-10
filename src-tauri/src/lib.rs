mod types;
mod utils;

use utils::{commands, db, music, shortcuts, tray};

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let handle = app.handle().clone();

            let app_data_dir = app.path().app_data_dir().expect("no app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();

            let audio_handle = music::spawn_audio_thread();
            app.manage(audio_handle.clone());
            app.manage(types::CurrentSong(Mutex::new(None)));

            tauri::async_runtime::block_on(async {
                let pool = db::init_db(&app_data_dir).await.expect("db init failed");
                app.manage(pool);
            });

            tray::setup_tray(&handle, audio_handle.clone())?;

            #[cfg(desktop)]
            {
                shortcuts::shortcuts_setup(&handle);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::play_song,
            commands::pause_song,
            commands::resume_song,
            commands::stop_song,
            commands::set_volume,
            commands::seek_song,
            commands::get_progress,
            commands::play_song_from_db,
            commands::add_local_song,
            commands::get_recent_songs,
            commands::get_quick_picks,
            commands::get_recently_played,
            commands::get_never_played,
            commands::get_playlists,
            commands::create_playlist,
            commands::get_playlist_with_songs,
            commands::update_song_field,
            commands::delete_playlist,
            commands::add_to_playlist,
            commands::get_current_song,
            commands::search_songs,
            commands::search_playlists,
            commands::get_n_songs,
            commands::get_songs_range,
            commands::get_song,
            commands::get_songs_by_sort,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}
