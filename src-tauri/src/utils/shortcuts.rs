use super::music;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn shortcuts_setup(app: &tauri::AppHandle) {
    let audio = app.state::<music::AudioHandle>().inner().clone();

    let key_pause = Shortcut::new(None, Code::MediaPlayPause);
    let key_next = Shortcut::new(None, Code::MediaTrackNext);
    let key_prev = Shortcut::new(None, Code::MediaTrackPrevious);
    let key_stop = Shortcut::new(None, Code::MediaStop);

    let _ = app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, shortcut, event| {
                if shortcut == &key_pause && event.state() == ShortcutState::Pressed {
                    audio.pause();
                }
                if shortcut == &key_next && event.state() == ShortcutState::Pressed {
                    println!("not implemented")
                }
                if shortcut == &key_prev && event.state() == ShortcutState::Pressed {
                    println!("not implemented")
                }
                if shortcut == &key_stop && event.state() == ShortcutState::Pressed {
                    println!("not implemented")
                }
            })
            .build(),
    );

    let _ = app.global_shortcut().register(key_pause);
}
