// use-player.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Progress = { position_secs: number; duration_secs: number | null; is_paused: boolean };

export type Song = {
    id: number;
    name: string;
    description?: string | null;
    author?: string | null;
    path: string;
};

interface s {
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
        } catch (e) {
            console.error(e);
        } finally {
            inFlight.current = false;
        }
    }, []);

    // Load current song once on mount (handles page refresh / hot reload)
    useEffect(() => {
        invoke<Song | null>("get_current_song")
            .then((song) => setState((s) => ({ ...s, currentSong: song })))
            .catch(console.error);
    }, []);

    useEffect(() => {
        refresh();
        const id = window.setInterval(refresh, 250);
        return () => clearInterval(id);
    }, [refresh]);

    const playSong = useCallback(async (id: number) => {
        try {
            const song = await invoke<Song>("play_song_from_db", { id });
            setState((s) => ({
                ...s,
                currentSong: song,
                playing: true,
                position: 0,
            }));
        } catch (e) {
            console.error(e);
        }
    }, []);

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