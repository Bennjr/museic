use std::sync::Mutex;
use std::time::Duration;

use super::{db, music};

pub struct CurrentSong(pub Mutex<Option<i64>>); 

#[derive(serde::Serialize)]
pub struct Progress {
    position_secs: f64,
    duration_secs: Option<f64>,
    is_paused: bool,
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
pub fn stop_song(audio: tauri::State<music::AudioHandle>) {
    audio.stop();
}

#[tauri::command]
pub fn get_progress(audio: tauri::State<music::AudioHandle>) -> Progress {
    let (pos, dur, paused) = audio.get_progress();
    Progress {
        position_secs: pos.as_secs_f64(),
        duration_secs: dur.map(|d| d.as_secs_f64()),
        is_paused: paused,
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

    sqlx::query("UPDATE songs SET play_count = play_count + 1, last_played = ?1 WHERE id = ?2")
        .bind(chrono::Local::now().to_rfc3339())
        .bind(id)
        .execute(db_pool.inner())
        .await
        .ok(); // non-fatal — don't fail playback if this write fails

    Ok(())
}


// DB COMMANDS
#[tauri::command]
pub async fn add_local_song(
    path: String,
    db_pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<i64, String> {
    let name = std::path::Path::new(&path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    // TODO: read real duration/artist via a tag crate (e.g. lofty) instead of these placeholders
    db::add_song(&db_pool, &name, "Unknown artist", &path, "0:00")
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_songs(pool: tauri::State<'_, sqlx::SqlitePool>) -> Result<Vec<db::Song>, String> {
    db::get_recent_songs(&pool, 5).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_quick_picks(pool: tauri::State<'_, sqlx::SqlitePool>) -> Result<Vec<db::Song>, String> {
    db::get_quick_picks(&pool, 9).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recently_played(pool: tauri::State<'_, sqlx::SqlitePool>) -> Result<Vec<db::Song>, String> {
    db::get_recently_played(&pool, 1).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_never_played(pool: tauri::State<'_, sqlx::SqlitePool>) -> Result<Vec<db::Song>, String> {
    db::get_never_played(&pool, 5).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlists(pool: tauri::State<'_, sqlx::SqlitePool>) -> Result<Vec<db::Playlist>, String> {
    db::get_playlists(&pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_playlist(
    name: String,
    description: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<i64, String> {
    db::create_playlist(&pool, &name, &description).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlist_with_songs(
    id: i64,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<(db::Playlist, Vec<db::Song>), String> {
    let playlist = db::get_playlist(&pool, id).await.map_err(|e| e.to_string())?;
    let songs = db::get_playlist_songs(&pool, id).await.map_err(|e| e.to_string())?;
    Ok((playlist, songs))
}

#[tauri::command]
pub async fn update_song_field(
    id: i64,
    field: String,
    value: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<(), String> {
    db::update_song_field(&pool, id, &field, &value).await.map_err(|e| e.to_string())
}