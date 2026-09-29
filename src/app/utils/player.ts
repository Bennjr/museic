import { invoke } from "@tauri-apps/api/core";

export const player = {
    play: (id: number) => invoke("play_song_from_db", { id }),
    pause: () => invoke("pause_song"),
    resume: () => invoke("resume_song"),
    stop: () => invoke("stop_song"),
    setVolume: (volume: number) => invoke("set_volume", { volume }),
    seek: (positionSecs: number) => invoke("seek_song", { positionSecs }),
};