import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Progress = { position_secs: number; duration_secs: number | null; is_paused: boolean };

export function usePlayer() {
    const [state, setState] = useState({ position: 0, duration: 0, playing: false });
    const ignorePollsUntil = useRef(0);
    const inFlight = useRef(false);
    const inFlightSince = useRef(0);

    const refresh = useCallback(async () => {
        console.log("poll start");
        if (inFlight.current && Date.now() - inFlightSince.current < 2000) return;
        inFlight.current = true;
        inFlightSince.current = Date.now();
        try {
            const p = await invoke<Progress>("get_progress");
            setState((s) => ({
                position: Date.now() < ignorePollsUntil.current ? s.position : p.position_secs,
                duration: p.duration_secs ?? s.duration,
                playing: !p.is_paused,
            }));
            console.log("poll done", p.position_secs);
        } catch (e) {
            console.error(e);
        } finally {
            inFlight.current = false;
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = window.setInterval(refresh, 250); // always keeps ticking
        return () => clearInterval(id);
    }, [refresh]);

    const seek = useCallback(async (secs: number) => {
        ignorePollsUntil.current = Date.now() + 600;
        setState((s) => ({ ...s, position: secs }));
        try {
            await invoke("seek_song", { positionSecs: secs });
        } catch (e) {
            console.error(e);
        }
    }, []);

    return { ...state, refresh, seek };
}