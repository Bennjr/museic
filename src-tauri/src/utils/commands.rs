use std::sync::Mutex;
use std::time::Duration;

use sqlx::pool;

use super::{db, music};
use crate::types;

// ══════════════════════════════════════
//  Song Playback
// ══════════════════════════════════════

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
pub fn playback(
    audio: tauri::State<music::AudioHandle>,
    playback: types::ePlayback,
) -> Result<(), String> {
    match playback {
        types::ePlayback::Play { path } => audio.play(&path),
        types::ePlayback::Resume => audio.resume(),
        types::ePlayback::Pause => audio.pause(),
        types::ePlayback::Stop => audio.stop(),
        types::ePlayback::Seek { position_secs } => {
            audio.seek(Duration::from_secs_f64(position_secs))
        }
        types::ePlayback::SetVolume { volume } => audio.set_volume(volume),
    }
    Ok(())
}

#[tauri::command]
pub fn get_progress(
    audio: tauri::State<music::AudioHandle>,
    current: tauri::State<types::CurrentSong>,
) -> types::Progress {
    let (pos, dur, paused) = audio.get_progress();
    types::Progress {
        position_secs: pos.as_secs_f64(),
        duration_secs: dur.map(|d| d.as_secs_f64()),
        is_paused: paused,
        current_song_id: *current.0.lock().unwrap(),
    }
}

#[tauri::command]
pub async fn play_song_from_db(
    id: i64,
    db_pool: tauri::State<'_, sqlx::SqlitePool>,
    audio: tauri::State<'_, music::AudioHandle>,
    current: tauri::State<'_, types::CurrentSong>,
) -> Result<types::Song, String> {
    let song = db::get_song(&db_pool, id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Song {id} not found"))?;

    audio.play(&song.path);

    *current.0.lock().unwrap() = Some(id);

    let _ =
        sqlx::query("UPDATE songs SET play_count = play_count + 1, last_played = ?1 WHERE id = ?2")
            .bind(chrono::Local::now().to_rfc3339())
            .bind(id)
            .execute(db_pool.inner())
            .await;

    Ok(song)
}

// ══════════════════════════════════════
//  DATABASE
// ══════════════════════════════════════

#[tauri::command]
pub async fn get_song(
    id: i64,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<types::Song, String> {
    db::get_song(&pool, id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "song not found".to_string())
}

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
pub async fn get_current_song(
    db_pool: tauri::State<'_, sqlx::SqlitePool>,
    current: tauri::State<'_, types::CurrentSong>,
) -> Result<Option<types::Song>, String> {
    let id = *current.0.lock().unwrap();
    match id {
        Some(id) => db::get_song(&db_pool, id).await.map_err(|e| e.to_string()),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn get_recent_songs(
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Song>, String> {
    db::get_recent_songs(&pool, 5)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_quick_picks(
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Song>, String> {
    db::get_quick_picks(&pool, 9)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recently_played(
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Song>, String> {
    db::get_recently_played(&pool, 1)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_never_played(
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Song>, String> {
    db::get_never_played(&pool, 5)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlists(
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Playlist>, String> {
    db::get_playlists(&pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_playlist(
    name: String,
    description: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<i64, String> {
    db::create_playlist(&pool, &name, &description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_playlist(
    id: i64,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<(), String> {
    db::delete_playlist(&pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_to_playlist(
    pool: tauri::State<'_, sqlx::SqlitePool>,
    playlist_id: i64,
    song_id: i64,
) -> Result<(), String> {
    db::add_to_playlist(&pool, playlist_id, song_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlist_with_songs(
    id: i64,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<(types::Playlist, Vec<types::Song>), String> {
    let playlist = db::get_playlist(&pool, id)
        .await
        .map_err(|e| e.to_string())?;
    let songs = db::get_playlist_songs(&pool, id)
        .await
        .map_err(|e| e.to_string())?;
    Ok((playlist, songs))
}

#[tauri::command]
pub async fn update_song_field(
    id: i64,
    field: String,
    value: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<(), String> {
    db::update_song_field(&pool, id, &field, &value)
        .await
        .map_err(|e| e.to_string())
}

// ══════════════════════════════════════
//  DATABASE
// ══════════════════════════════════════

#[tauri::command]
pub async fn search_songs(
    query: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Song>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    db::search_songs(&pool, &query, 30)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_songs_by_sort(
    pool: tauri::State<'_, sqlx::SqlitePool>,
    sort_by: String,
    offset: i64,
    limit: i64,
) -> Result<Vec<types::Song>, String> {
    db::get_songs_by_sort(&pool, &sort_by, offset, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_playlists(
    query: String,
    pool: tauri::State<'_, sqlx::SqlitePool>,
) -> Result<Vec<types::Playlist>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    db::search_playlists(&pool, &query, 10)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_n_songs(
    pool: tauri::State<'_, sqlx::SqlitePool>,
    n: i64,
) -> Result<Vec<types::Song>, String> {
    db::get_songs_range(&pool, 0, n)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_songs_range(
    pool: tauri::State<'_, sqlx::SqlitePool>,
    offset: i64,
    limit: i64,
) -> Result<Vec<types::Song>, String> {
    db::get_songs_range(&pool, offset, limit)
        .await
        .map_err(|e| e.to_string())
}
