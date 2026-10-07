use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player, Source};
use std::fs::File;
use std::sync::mpsc::{self, Sender};
use std::thread;
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

fn open_output(volume: f32) -> Option<(MixerDeviceSink, Player)> {
    for _ in 0..5 {
        match DeviceSinkBuilder::open_default_sink() {
            Ok(sink) => {
                let player = Player::connect_new(&sink.mixer());
                player.set_volume(volume);
                return Some((sink, player));
            }
            Err(e) => {
                eprintln!("failed to open audio device: {e}");
                thread::sleep(Duration::from_millis(200));
            }
        }
    }
    None
}

pub fn spawn_audio_thread() -> AudioHandle {
    let (tx, rx) = mpsc::channel::<AudioCommand>();

    thread::spawn(move || {
        let mut volume: f32 = 1.0;
        let mut output = open_output(volume);
        let mut current_duration: Option<Duration> = None;

        for command in rx {
            match command {
                AudioCommand::Play(path) => {
                    drop(output.take());
                    output = open_output(volume);

                    if let Some((_, player)) = &output {
                        match File::open(&path) {
                            Ok(file) => match Decoder::try_from(file) {
                                Ok(source) => {
                                    current_duration = source.total_duration();
                                    player.append(source);
                                    player.play();
                                }
                                Err(e) => eprintln!("failed to decode {path}: {e}"),
                            },
                            Err(e) => eprintln!("failed to open {path}: {e}"),
                        }
                    }
                }

                AudioCommand::Pause => {
                    if let Some((_, p)) = &output {
                        p.pause();
                    }
                }
                AudioCommand::Resume => {
                    if let Some((_, p)) = &output {
                        p.play();
                    }
                }
                AudioCommand::SetVolume(v) => {
                    volume = v as f32;
                    if let Some((_, p)) = &output {
                        p.set_volume(volume);
                    }
                }
                AudioCommand::GetProgress(reply) => {
                    if let Some((_, p)) = &output {
                        let _ = reply.send((p.get_pos(), current_duration, p.is_paused()));
                    }
                }
                AudioCommand::SeekTo(pos) => {
                    if let Some((_, p)) = &output {
                        if let Err(e) = p.try_seek(pos) {
                            eprintln!("seek failed: {e}");
                        }
                    }
                }
                AudioCommand::Stop => {
                    if let Some((_, p)) = &output {
                        p.stop();
                    }
                }
            }
        }
    });

    AudioHandle { sender: tx }
}
