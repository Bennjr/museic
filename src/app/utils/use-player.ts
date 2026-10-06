// use-player.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Progress = {
    position_secs: number;
    duration_secs: number | null;
    is_paused: boolean;
    current_song_id: number | null;
};

export type Song = {
    id: number;
    name: string;
    description: string | null;
    play_count: number;
    last_played: string | null;
    author: string | null;
    added: string | null;
    length: string | null;
    path: string;
    cover: string | null;
}

export function usePlayer() {
    const [state, setState] = useState({
        position: 0,
        duration: 0,
        playing: false,
        currentSong: null as Song | null,
    });

    const ignorePollsUntil = useRef(0);
    const inFlight = useRef(false);
    const inFlightSince = useRef(0);
    const lastSongId = useRef<number | null>(null);

    const refresh = useCallback(async () => {
        if (inFlight.current && Date.now() - inFlightSince.current < 2000) return;
        inFlight.current = true;
        inFlightSince.current = Date.now();
        try {
            const p = await invoke<Progress>("get_progress");

            setState((s) => ({
                ...s,
                position: Date.now() < ignorePollsUntil.current ? s.position : p.position_secs,
                duration: p.duration_secs ?? s.duration,
                playing: !p.is_paused,
            }));

            // only hit the DB for the full song when the id actually changes
            if (p.current_song_id !== lastSongId.current) {
                lastSongId.current = p.current_song_id;
                if (p.current_song_id === null) {
                    setState((s) => ({ ...s, currentSong: null, duration: 0, position: 0 }));
                } else {
                    const song = await invoke<Song>("get_song", { id: p.current_song_id });
                    setState((s) => ({ ...s, currentSong: song }));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            inFlight.current = false;
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = window.setInterval(refresh, 250);
        return () => clearInterval(id);
    }, [refresh]);

    const playSong = useCallback(
        async (id: number) => {
            try {
                await invoke("play_song_from_db", { id });
                await refresh(); // pulls the new song immediately instead of waiting for the next tick
            } catch (e) {
                console.error(e);
            }
        },
        [refresh]
    );

    const seek = useCallback(async (secs: number) => {
        ignorePollsUntil.current = Date.now() + 600;
        setState((s) => ({ ...s, position: secs }));
        try {
            await invoke("seek_song", { positionSecs: secs });
        } catch (e) {
            console.error(e);
        }
    }, []);

    return {
        ...state,
        refresh,
        seek,
        playSong,
    };
}