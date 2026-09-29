use std::fs::File;
use rodio::{Decoder, Source, DeviceSinkBuilder, Player};
use std::thread;
use std::sync::mpsc::{self, Sender};
use std::time::Duration;

pub enum AudioCommand {
    Play(String),
    Pause,
    Resume,
    SetVolume(f32),
    GetProgress(Sender<(Duration, Option<Duration>, bool)>),
    SeekTo(Duration),
    Stop,
}

#[derive(Clone)]
pub struct AudioHandle {
    sender: Sender<AudioCommand>,
}

impl AudioHandle {
    pub fn play(&self, path: impl Into<String>) {
        let _ = self.sender.send(AudioCommand::Play(path.into()));
    }

    pub fn pause(&self) {
        let _ = self.sender.send(AudioCommand::Pause);
    }

    pub fn resume(&self) {
        let _ = self.sender.send(AudioCommand::Resume);
    }

    pub fn set_volume(&self, volume: f32) {
        let _ = self.sender.send(AudioCommand::SetVolume(volume));
    }

    pub fn get_progress(&self) -> (Duration, Option<Duration>, bool) {
        let (reply_tx, reply_rx) = mpsc::channel();
        let _ = self.sender.send(AudioCommand::GetProgress(reply_tx));
        reply_rx.recv().unwrap_or((Duration::ZERO, None, true))
    }

    pub fn seek(&self, position: Duration) {
        let _ = self.sender.send(AudioCommand::SeekTo(position));
    }

    pub fn stop(&self) {
        let _ = self.sender.send(AudioCommand::Stop);
    }
}

pub fn spawn_audio_thread() -> AudioHandle {
    let (tx, rx) = mpsc::channel::<AudioCommand>();

    thread::spawn(move || {
        let handle = DeviceSinkBuilder::open_default_sink()
            .expect("open default audio stream");
        let player = Player::connect_new(&handle.mixer());
        let mut current_duration: Option<Duration> = None;

        for command in rx {
            match command {
                AudioCommand::Play(path) => match File::open(&path) {
                    Ok(file) => match Decoder::try_from(file) {
                        Ok(source) => {
                            current_duration = source.total_duration();
                            player.clear();
                            player.append(source);
                            player.play();
                        }
                        Err(e) => eprintln!("failed to decode {path}: {e}"),
                    },
                    Err(e) => eprintln!("failed to open {path}: {e}"),
                },

                AudioCommand::Pause => player.pause(),
                AudioCommand::Resume => player.play(),

                AudioCommand::SetVolume(v) => player.set_volume(v as _),
                AudioCommand::GetProgress(reply) => {
                    let pos = player.get_pos();
                    let _ = reply.send((pos, current_duration, player.is_paused()));
                }

                AudioCommand::SeekTo(pos) => {
                    if let Err(e) = player.try_seek(pos) {
                        eprintln!("seek failed: {e}");
                    }
                }

                AudioCommand::Stop => player.stop(),
            }
        }
    });

    AudioHandle { sender: tx }
}