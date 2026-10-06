use chrono::{DateTime, Utc};
use rand::Rng;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::Path;

use crate::types::{Playlist, Song, SONG_COLUMNS};

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
pub async fn get_song(pool: &sqlx::SqlitePool, id: i64) -> Result<Option<Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
        WHERE id = ?1"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn get_recent_songs(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY id DESC \
         LIMIT ?1"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_quick_picks(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY play_count DESC, id DESC \
         LIMIT ?1"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_recently_played(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE last_played IS NOT NULL \
         ORDER BY last_played DESC LIMIT ?1"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn get_never_played(
    pool: &sqlx::SqlitePool,
    limit: i64,
) -> Result<Vec<Song>, sqlx::Error> {
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE play_count = 0 \
         ORDER BY id DESC LIMIT ?1"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

// ══════════════════════════════════════
//  QUEUE MANAGEMENT
// ══════════════════════════════════════

pub struct Queue {
    songs: Vec<Song>,
    current_index: Option<usize>,
}

pub async fn create_queue(pool: &sqlx::SqlitePool, count: usize) -> Result<Queue, sqlx::Error> {
    let sql = format!("Select {SONG_COLUMNS} FROM songs");
    let songs = sqlx::query_as::<_, Song>(&sql).fetch_all(pool).await?;

    if songs.is_empty() {
        return Ok(Queue {
            songs: vec![],
            current_index: None,
        });
    }

    let now = Utc::now();

    let mut pool: Vec<(Song, f64)> = songs
        .into_iter()
        .map(|song| {
            let weight = calculate_weight(&song, now);
            (song, weight)
        })
        .collect();

    let mut queue = Vec::with_capacity(count.min(pool.len()));
    let mut rng = rand::rngs::ThreadRng::default();

    for _ in 0..count {
        if pool.is_empty() {
            break;
        }

        let total_weight: f64 = pool.iter().map(|(_, w)| *w).sum();

        if total_weight <= 0.0 {
            break;
        }

        let mut pick = rand::random_range(0.0..total_weight);
        let mut chosen_index = 0;

        for (i, (_, weight)) in pool.iter().enumerate() {
            if pick < *weight {
                chosen_index = i;
                break;
            }
            pick -= weight;
        }

        let (song, _) = pool.swap_remove(chosen_index);
        queue.push(song);
    }

    Ok(Queue {
        songs: queue.clone(),
        current_index: if queue.is_empty() { None } else { Some(0) },
    })
}

fn calculate_weight(song: &Song, now: DateTime<Utc>) -> f64 {
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
) -> Result<Vec<Song>, sqlx::Error> {
    let from = from.max(0);
    let limit = (to - from).max(0);

    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         ORDER BY id DESC \
         LIMIT ?1 OFFSET ?2"
    );

    sqlx::query_as::<_, Song>(&sql)
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
) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        r#"
        SELECT s.id, s.name, s.description, s.author, s.added, s.length, s.path
        FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = ?1
        ORDER BY ps.position
        "#,
    )
    .bind(playlist_id)
    .fetch_all(pool)
    .await
}

pub async fn get_playlists(pool: &sqlx::SqlitePool) -> Result<Vec<Playlist>, sqlx::Error> {
    sqlx::query_as::<_, Playlist>(
        "SELECT id, name, description, created FROM playlists ORDER BY created DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_playlist(pool: &sqlx::SqlitePool, id: i64) -> Result<Playlist, sqlx::Error> {
    sqlx::query_as::<_, Playlist>(
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
) -> Result<Vec<Song>, sqlx::Error> {
    let pattern = format!("%{query}%");
    let sql = format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE name LIKE ?1 OR author LIKE ?1 OR description LIKE ?1 \
         ORDER BY name \
         LIMIT ?2"
    );
    sqlx::query_as::<_, Song>(&sql)
        .bind(pattern)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn search_playlists(
    pool: &sqlx::SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<Playlist>, sqlx::Error> {
    let pattern = format!("%{query}%");
    let sql = format!(
        "SELECT id, name, description, created FROM playlists \
         WHERE name LIKE ?1 OR description LIKE ?1 \
         ORDER BY name \
         LIMIT ?2"
    );
    sqlx::query_as::<_, Playlist>(&sql)
        .bind(pattern)
        .bind(limit)
        .fetch_all(pool)
        .await
}
