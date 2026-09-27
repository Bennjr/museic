use std::sync::Mutex;
use std::time::Duration;

use super::{db, music};

pub struct CurrentSong(pub Mutex<Option<i64>>); 

#[derive(serde::Serialize)]
pub struct Progress {
    position_secs: f64,
    duration_secs: Option<f64>,
}

#[tauri::command]
pub fn play_song(path: String, audio: tauri::State<music::AudioHandle>) {
    audio.play(path);
}

#[tauri::command]
pub fn pause_song(audio: tauri::State<music::AudioHandle>) {
    audio.pause();
}

#[tauri::command]
pub fn resume_song(audio: tauri::State<music::AudioHandle>) {
    audio.resume();
}

#[tauri::command]
pub fn set_volume(volume: f32, audio: tauri::State<music::AudioHandle>) {
    audio.set_volume(volume);
}

#[tauri::command]
pub fn seek_song(position_secs: f64, audio: tauri::State<music::AudioHandle>) {
    audio.seek(Duration::from_secs_f64(position_secs));
}

#[tauri::command]
pub fn get_progress(audio: tauri::State<music::AudioHandle>) -> Progress {
    let (pos, dur) = audio.get_progress();
    Progress {
        position_secs: pos.as_secs_f64(),
        duration_secs: dur.map(|d| d.as_secs_f64()),
    }
}

#[tauri::command]
pub async fn play_song_from_db(
    id: i64,
    db_pool: tauri::State<'_, sqlx::SqlitePool>,
    audio: tauri::State<'_, music::AudioHandle>,
    current: tauri::State<'_, CurrentSong>,
) -> Result<(), String> {
    let path = db::get_song_path(&db_pool, id).await.map_err(|e| e.to_string())?;
    audio.play(path);
    *current.0.lock().unwrap() = Some(id);
    Ok(())
}