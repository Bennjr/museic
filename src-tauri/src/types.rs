use std::sync::Mutex;

// ══════════════════════════════════════
//  Song
// ══════════════════════════════════════

#[derive(serde::Serialize, sqlx::FromRow, Clone)]
pub struct Song {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub play_count: i32,
    pub last_played: Option<String>,
    pub author: String,
    pub added: String,
    pub length: String,
    pub path: String,
}

pub struct CurrentSong(pub Mutex<Option<i64>>); 

#[derive(serde::Serialize)]
pub struct Progress {
    pub position_secs: f64,
    pub duration_secs: Option<f64>,
    pub is_paused: bool,
}

pub enum ePlayback {
    Play {path: String},
    Pause,
    Resume,
    Stop,
    Seek {position_secs: f64},
    SetVolume {volume: f32},
}

// ══════════════════════════════════════
//  DATABASE
// ══════════════════════════════════════

#[derive(serde::Serialize, sqlx::FromRow, Clone)]
pub struct Playlist {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub created: String,
}