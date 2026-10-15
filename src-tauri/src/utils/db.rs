use super::{audio, tray};
use chrono::{DateTime, Utc};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::Path;

use crate::types::{self, SONG_COLUMNS};

// ══════════════════════════════════════
//  SETUP
// ══════════════════════════════════════

pub async fn init_db(app_data_dir: &Path) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app_data_dir.join("app.db");

    if !db_path.exists() {
        std::fs::File::create(&db_path).expect("failed to create db file");
    }

    let db_url = format!("sqlite:{}", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            author TEXT,
            added TEXT,
            length TEXT,
            path TEXT NOT NULL,
            play_count INTEGER NOT NULL DEFAULT 0,
            last_played TEXT,
            cover TEXT
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created TEXT NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS playlist_songs (
            playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
            song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
            position INTEGER NOT NULL,
            PRIMARY KEY (playlist_id, song_id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

// ══════════════════════════════════════
//  GENERAL SONG MANAGEMENT
// ══════════════════════════════════════

pub async fn add_song(
    pool: &sqlx::SqlitePool,
    name: &str,
    author: &str,
    path: &str,
    length: &str,
) -> Result<i64, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    let id = sqlx::query(
        r#"
            INSERT INTO songs ( name, description, author, added, length, path )
            VALUES ( ?1, ?2, ?3, ?4, ?5, ?6 )
        "#,
    )
    .bind(name)
    .bind("")
    .bind(author)
    .bind(chrono::Local::now().format("%b %d %Y").to_string())
    .bind(length)
    .bind(path)
    .execute(&mut *conn)
    .await?
    .last_insert_rowid();

    Ok(id)
}

// TODO, FIND HASH OF mp3 AND ADD IT ALONG WITH THE OTHER INFO
pub async fn get_song(
    pool: &sqlx::SqlitePool,
    id: i64,
) -> Result<Option<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
        WHERE id = ?1"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn get_recent_songs(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY id DESC \
         LIMIT ?1"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_quick_picks(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY play_count DESC, id DESC \
         LIMIT ?1"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_recently_played(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE last_played IS NOT NULL \
         ORDER BY last_played DESC LIMIT ?1"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_never_played(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE play_count = 0 \
         ORDER BY id DESC LIMIT ?1"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

// ══════════════════════════════════════
//  PLAYBACK + QUEUE
// ══════════════════════════════════════

/// Starts a song, records the play, updates the tray.
pub async fn begin(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    song: &types::Song,
) {
    audio.play(song.path.clone());
    *current.0.lock().unwrap() = Some(song.id);

    let _ =
        sqlx::query("UPDATE songs SET play_count = play_count + 1, last_played = ?1 WHERE id = ?2")
            .bind(chrono::Local::now().to_rfc3339())
            .bind(song.id)
            .execute(pool)
            .await;

    if let Err(e) = tray::update_tray(app, &song.name) {
        eprintln!("failed to update tray: {e}");
    }
}

pub async fn play_from_db(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    id: i64,
) -> Result<types::Song, String> {
    let song = get_song(pool, id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Song {id} not found"))?;
    begin(app, pool, audio, current, &song).await;
    Ok(song)
}

pub async fn next_song(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
) -> Option<types::Song> {
    let song = {
        let mut q = queue.0.lock().unwrap();
        let i = q.current_index? + 1;
        if i >= q.songs.len() {
            return None; // end of queue
        }
        q.current_index = Some(i);
        q.songs[i].clone()
    }; // lock released before the await
    begin(app, pool, audio, current, &song).await;
    Some(song)
}

pub async fn prev_song(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
) -> Option<types::Song> {
    let song = {
        let mut q = queue.0.lock().unwrap();
        let i = q.current_index?.checked_sub(1)?;
        q.current_index = Some(i);
        q.songs[i].clone()
    };
    begin(app, pool, audio, current, &song).await;
    Some(song)
}

pub async fn navigate_queue(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    to: i64,
) -> Option<types::Song> {
    let index = usize::try_from(to).ok()?;
    let song = {
        let mut q = queue.0.lock().unwrap();
        let song = q.songs.get(index)?.clone();
        q.current_index = Some(index);
        song
    };
    begin(app, pool, audio, current, &song).await;
    Some(song)
}

/// Replace the queue and start at `start_index`.
pub async fn activate(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    songs: Vec<types::Song>,
    start_index: usize,
) -> Option<types::Song> {
    if songs.is_empty() {
        return None;
    }
    let index = start_index.min(songs.len() - 1);
    let song = songs[index].clone();
    {
        let mut q = queue.0.lock().unwrap();
        q.songs = songs;
        q.current_index = Some(index);
    }
    begin(app, pool, audio, current, &song).await;
    Some(song)
}

pub async fn play_songs(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    song_ids: Vec<i64>,
    start_index: usize,
) -> Result<Option<types::Song>, String> {
    let mut songs = Vec::with_capacity(song_ids.len());
    for id in song_ids {
        if let Some(s) = get_song(pool, id).await.map_err(|e| e.to_string())? {
            songs.push(s);
        }
    }
    Ok(activate(app, pool, queue, audio, current, songs, start_index).await)
}

pub async fn play_playlist(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    playlist_id: i64,
    start_index: Option<usize>,
    shuffled: bool,
) -> Result<Option<types::Song>, String> {
    let mut songs = get_playlist_songs(pool, playlist_id)
        .await
        .map_err(|e| e.to_string())?;
    let start = if shuffled {
        songs = shuffle_songs(songs);
        0
    } else {
        start_index.unwrap_or(0)
    };
    Ok(activate(app, pool, queue, audio, current, songs, start).await)
}

pub async fn add_to_queue(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
    song_id: i64,
) -> Result<(), String> {
    let song = get_song(pool, song_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("song not found")?;

    let start_now = {
        let mut q = queue.0.lock().unwrap();
        q.songs.push(song.clone());
        if q.current_index.is_none() {
            q.current_index = Some(q.songs.len() - 1);
            true
        } else {
            false
        }
    };
    if start_now {
        begin(app, pool, audio, current, &song).await;
    }
    Ok(())
}

/// Reshuffles the queue. The playing song stays first and keeps playing.
pub async fn shuffle(
    app: &tauri::AppHandle,
    pool: &sqlx::SqlitePool,
    queue: &types::QueueState,
    audio: &audio::AudioHandle,
    current: &types::CurrentSong,
) -> types::Queue {
    let (result, to_play) = {
        let mut q = queue.0.lock().unwrap();

        let playing = q.current_index.and_then(|i| q.songs.get(i)).cloned();
        let mut rest = q.songs.clone();
        if let Some(p) = &playing {
            rest.retain(|s| s.id != p.id);
        }

        let mut songs = shuffle_songs(rest);
        if let Some(p) = playing.clone() {
            songs.insert(0, p);
        }

        q.current_index = if songs.is_empty() { None } else { Some(0) };
        q.songs = songs;

        let to_play = if playing.is_none() {
            q.songs.first().cloned()
        } else {
            None
        };
        (q.clone(), to_play)
    };

    if let Some(song) = to_play {
        begin(app, pool, audio, current, &song).await;
    }
    result
}

pub fn shuffle_songs(songs: Vec<types::Song>) -> Vec<types::Song> {
    let now = Utc::now();
    let mut pool: Vec<(types::Song, f64)> = songs
        .into_iter()
        .map(|song| {
            let w = calculate_weight(&song, now);
            (song, w)
        })
        .collect();

    let mut out = Vec::with_capacity(pool.len());
    while !pool.is_empty() {
        let total: f64 = pool.iter().map(|(_, w)| *w).sum();
        let mut pick = rand::random_range(0.0..total);
        let mut chosen = pool.len() - 1;

        for (i, (_, w)) in pool.iter().enumerate() {
            if pick < *w {
                chosen = i;
                break;
            }
            pick -= *w;
        }
        out.push(pool.swap_remove(chosen).0);
    }
    out
}

fn calculate_weight(song: &types::Song, now: DateTime<Utc>) -> f64 {
    let days_since = match &song.last_played {
        Some(last_played) => match DateTime::parse_from_rfc3339(last_played) {
            Ok(dt) => (now - dt.with_timezone(&Utc)).num_days() as f64,
            Err(_) => 999.0,
        },
        None => 999.0, // never played
    };

    let mut weight = 1.0;

    // Boost recently played songs (last 14 days)
    if days_since < 14.0 {
        weight += 2.2 * (1.0 - days_since / 14.0);
    }

    // Boost favorites
    if song.play_count >= 8 {
        weight += 1.6;
    }

    // Boost new / rarely played songs
    if song.play_count <= 2 {
        weight += 1.9;
    }

    // Strong penalty if played in the last 2 days
    if days_since < 2.0 {
        weight *= 0.25;
    }

    weight.max(0.05)
}

pub async fn update_song_field(
    pool: &sqlx::SqlitePool,
    id: i64,
    field: &str,
    value: &str,
) -> Result<(), sqlx::Error> {
    let column = match field {
        "name" | "description" | "author" | "added" => field,
        _ => return Err(sqlx::Error::ColumnNotFound(field.to_string())),
    };
    let query = format!("UPDATE songs SET {column} = ?1 WHERE id = ?2");
    sqlx::query(&query)
        .bind(value)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_songs_range(
    pool: &SqlitePool,
    from: i64,
    to: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let from = from.max(0);
    let limit = (to - from).max(0);

    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY id DESC \
         LIMIT ?1 OFFSET ?2"
    );

    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .bind(from)
        .fetch_all(pool)
        .await
}

pub async fn get_songs_by_sort(
    pool: &SqlitePool,
    sort_by: &str,
    offset: i64,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let from = offset.max(0);
    let limit = limit.max(0);

    let order_clause = match sort_by {
        "recent" => "ORDER BY id DESC",
        "popular" => "ORDER BY play_count DESC, id DESC",
        "recently_played" => "WHERE last_played IS NOT NULL ORDER BY last_played DESC",
        "never_played" => "WHERE play_count = 0 ORDER BY id DESC",
        "all" => "ORDER BY id DESC",
        _ => return Err(sqlx::Error::ColumnNotFound(sort_by.to_string())),
    };

    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         {order_clause} \
         LIMIT ?1 OFFSET ?2"
    );

    sqlx::query_as::<_, types::Song>(&sql)
        .bind(limit)
        .bind(from)
        .fetch_all(pool)
        .await
}

// ══════════════════════════════════════
//  PLAYLIST MANAGEMENT
// ══════════════════════════════════════

pub async fn create_playlist(
    pool: &sqlx::SqlitePool,
    name: &str,
    description: &str,
) -> Result<i64, sqlx::Error> {
    let id = sqlx::query("INSERT INTO playlists (name, description, created) VALUES (?1, ?2, ?3)")
        .bind(name)
        .bind(description)
        .bind(chrono::Local::now().to_rfc3339())
        .execute(pool)
        .await?
        .last_insert_rowid();
    Ok(id)
}

pub async fn delete_playlist(pool: &sqlx::SqlitePool, playlist_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
            DELETE FROM playlists WHERE id = ?1
        "#,
    )
    .bind(playlist_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn add_to_playlist(
    pool: &sqlx::SqlitePool,
    playlist_id: i64,
    song_id: i64,
) -> Result<(), sqlx::Error> {
    let next_pos: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(MAX(position), 0) + 1
        FROM playlist_songs
        WHERE playlist_id = ?
        "#,
    )
    .bind(playlist_id)
    .fetch_one(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO playlist_songs (playlist_id, song_id, position)
        VALUES (?, ?, ?)
        "#,
    )
    .bind(playlist_id)
    .bind(song_id)
    .bind(next_pos)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_playlist_songs(
    pool: &sqlx::SqlitePool,
    playlist_id: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} \
        FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = ?1
        ORDER BY ps.position"
    );

    sqlx::query_as::<_, types::Song>(&sql)
        .bind(playlist_id)
        .fetch_all(pool)
        .await
}

pub async fn get_playlists(pool: &sqlx::SqlitePool) -> Result<Vec<types::Playlist>, sqlx::Error> {
    sqlx::query_as::<_, types::Playlist>(
        "SELECT id, name, description, created FROM playlists ORDER BY created DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_playlist(
    pool: &sqlx::SqlitePool,
    id: i64,
) -> Result<types::Playlist, sqlx::Error> {
    sqlx::query_as::<_, types::Playlist>(
        "SELECT id, name, description, created FROM playlists WHERE id = ?1",
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

// ══════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════

pub async fn search_songs(
    pool: &sqlx::SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<types::Song>, sqlx::Error> {
    let pattern = format!("%{query}%");
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE name LIKE ?1 OR author LIKE ?1 OR description LIKE ?1 \
         ORDER BY name \
         LIMIT ?2"
    );
    sqlx::query_as::<_, types::Song>(&sql)
        .bind(pattern)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn search_playlists(
    pool: &sqlx::SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<types::Playlist>, sqlx::Error> {
    let pattern = format!("%{query}%");
    let sql = format!(
        "SELECT id, name, description, created FROM playlists \
         WHERE name LIKE ?1 OR description LIKE ?1 \
         ORDER BY name \
         LIMIT ?2"
    );
    sqlx::query_as::<_, types::Playlist>(&sql)
        .bind(pattern)
        .bind(limit)
        .fetch_all(pool)
        .await
}
