import { useEffect, useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";

export type Playlist = { id: number; name: string; description: string; created: string };

let playlists: Playlist[] = [];
let initialLoad: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export async function refreshPlaylists() {
    try {
        playlists = await invoke<Playlist[]>("get_playlists");
        emit();
    } catch (e) {
        console.error(e);
    }
}

export async function createPlaylist(name: string, description = "") {
    const id = await invoke<number>("create_playlist", { name: name, description: description });
    await refreshPlaylists();
    return id;
}

export async function deletePlaylist(id: number) {
    await invoke("delete_playlist", { id: id });
    await refreshPlaylists();
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const getSnapshot = () => playlists;

export function usePlaylists() {
    const list = useSyncExternalStore(subscribe, getSnapshot);
    useEffect(() => {
        initialLoad ??= refreshPlaylists();
    }, []);
    return list;
}