use sqlx::{
    sqlite::{SqlitePool, SqlitePoolOptions},
};

use std::path::Path;

#[derive(serde::Serialize, sqlx::FromRow, Clone)]
pub struct Song {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub author: String,
    pub added: String,
    pub length: String,
    pub path: String,
}

#[derive(serde::Serialize, sqlx::FromRow, Clone)]
pub struct Playlist {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub created: String,
}


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
            last_played TEXT
        )
        "#
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
        "#
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
        "#
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

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

pub async fn get_song_path(pool: &sqlx::SqlitePool, id: i64) -> Result<String, sqlx::Error> {
    let row: (String,) = sqlx::query_as("SELECT path FROM songs WHERE id = ?1")
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(row.0)
}

pub async fn get_recent_songs(pool: &sqlx::SqlitePool, limit: i64) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        "SELECT id, name, description, author, added, length, path FROM songs ORDER BY id DESC LIMIT ?1"
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_quick_picks(pool: &sqlx::SqlitePool, limit: i64) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        "SELECT id, name, description, author, added, length, path FROM songs ORDER BY play_count DESC, id DESC LIMIT ?1"
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_recently_played(pool: &sqlx::SqlitePool, limit: i64) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        "SELECT id, name, description, author, added, length, path FROM songs WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT ?1"
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_never_played(pool: &sqlx::SqlitePool, limit: i64) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        "SELECT id, name, description, author, added, length, path FROM songs WHERE play_count = 0 ORDER BY id DESC LIMIT ?1"
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_playlists(pool: &sqlx::SqlitePool) -> Result<Vec<Playlist>, sqlx::Error> {
    sqlx::query_as::<_, Playlist>("SELECT id, name, description, created FROM playlists ORDER BY created DESC")
        .fetch_all(pool)
        .await
}

pub async fn get_playlist(pool: &sqlx::SqlitePool, id: i64) -> Result<Playlist, sqlx::Error> {
    sqlx::query_as::<_, Playlist>("SELECT id, name, description, created FROM playlists WHERE id = ?1")
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn get_playlist_songs(pool: &sqlx::SqlitePool, playlist_id: i64) -> Result<Vec<Song>, sqlx::Error> {
    sqlx::query_as::<_, Song>(
        r#"
        SELECT s.id, s.name, s.description, s.author, s.added, s.length, s.path
        FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = ?1
        ORDER BY ps.position
        "#
    )
    .bind(playlist_id)
    .fetch_all(pool)
    .await
}

pub async fn create_playlist(pool: &sqlx::SqlitePool, name: &str, description: &str) -> Result<i64, sqlx::Error> {
    let id = sqlx::query("INSERT INTO playlists (name, description, created) VALUES (?1, ?2, ?3)")
        .bind(name)
        .bind(description)
        .bind(chrono::Local::now().to_rfc3339())
        .execute(pool)
        .await?
        .last_insert_rowid();
    Ok(id)
}

pub async fn update_song_field(pool: &sqlx::SqlitePool, id: i64, field: &str, value: &str) -> Result<(), sqlx::Error> {
    // whitelist columns — never interpolate `field` from user input directly into SQL otherwise
    let column = match field {
        "name" | "description" | "author" | "added" => field,
        _ => return Err(sqlx::Error::ColumnNotFound(field.to_string())),
    };
    let query = format!("UPDATE songs SET {column} = ?1 WHERE id = ?2");
    sqlx::query(&query).bind(value).bind(id).execute(pool).await?;
    Ok(())
}