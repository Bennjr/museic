use sqlx::{
    sqlite::{SqlitePool, SqlitePoolOptions},
};

use std::path::Path;

pub async fn init_db(app_data_dir: &Path) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app_data_dir.join("app.db");

    // create the file if it doesn't exist — sqlx won't do this for you
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
            path TEXT NOT NULL
        )
        "#
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

// TEMP TO TEST
#[derive(serde::Serialize, sqlx::FromRow)]
struct Song {
    id: i64,
    name: String,
    description: String,
    author: String,
    added: String,
    length: String,
    path: String,
}


pub async fn create_temp(pool: &sqlx::SqlitePool) -> Result<i64, sqlx::Error> {
    let test_mp3_path = concat!(env!("CARGO_MANIFEST_DIR"), "/src/utils/test.mp3");
    let mut conn = pool.acquire().await?;

    let id = sqlx::query(
        r#"
            INSERT INTO songs ( name, description, author, added, length, path )
            VALUES ( ?1, ?2, ?3, ?4, ?5, ?6 )
        "#
    )
    .bind("Something")
    .bind("Some desc")
    .bind("Some author")
    .bind("Dec 28 2026")
    .bind("3:23")
    .bind(test_mp3_path)
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

//pub async fn query_song(pool: &SqlitePool) -> Result<()> {
//    let recs = sqlx::query!(
//        r#"
//            SELECT id, description, done
//            FROM songs
//            ORDER BY id
//        "#
//    )
//    .fetch_all(pool)
//    .await?;
//
//    Ok(())
//}

//pub async fn save_song() -> Result<(), sqlx::Error> {

//}