use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Manager,
};

use super::{commands, music};
use crate::types;

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let pause_i = MenuItem::with_id(app, "pause", "Pause", true, None::<&str>)?;
    let skip_i = MenuItem::with_id(app, "skip", "Skip", true, None::<&str>)?;

    let current_song_i =
        MenuItem::with_id(app, "current", "types::Currentsong", true, None::<&str>)?;

    let tray = Menu::with_id_and_items(
        app,
        "tray_menu",
        &[&current_song_i, &pause_i, &skip_i, &quit_i],
    );

    app.manage(types::TrayItems {
        current_song: current_song_i,
    });

    return tray;
}

pub fn update_tray(app: &AppHandle, text: &str) -> tauri::Result<()> {
    let items = app.state::<types::TrayItems>();
    items.current_song.set_text(format!("Song: {text}"))
}

pub fn setup_tray(app: &AppHandle, audio_handle: music::AudioHandle) -> tauri::Result<TrayIcon> {
    let menu = build_menu(app)?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "pause" => println!("Not implemented"),
            "skip" => println!("Not implemented"),
            _ => {}
        })
        .build(app)
}
