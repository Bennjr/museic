import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { HardDrive, Link as LinkIcon, Loader2, Check, AlertCircle } from "lucide-react";

type Source = "local" | "link";
type Status = "idle" | "loading" | "success" | "error";

const sources: { id: Source; label: string; icon: typeof HardDrive }[] = [
    { id: "local", label: "From local", icon: HardDrive },
    { id: "link", label: "From link", icon: LinkIcon },
];

export default function Add() {
    const [source, setSource] = useState<Source>("local");

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-bold">Add music</h1>
                <p className="text-sm opacity-50 mt-1">Import songs from your computer or a link</p>
            </div>

            <div className="flex p-1 bg-white/5 rounded-xl">
                {sources.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setSource(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${source === id ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
                            }`}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
            </div>

            <div className="min-h-64">
                {source === "local" ? <LocalImport /> : <LinkImport />}
            </div>
        </div>
    );
}

function LocalImport() {
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [dragOver, setDragOver] = useState(false);

    const importFiles = async (paths: string[]) => {
        if (paths.length === 0) return;
        setStatus("loading");
        try {
            for (const path of paths) {
                await invoke("add_local_song", { path });
            }
            setStatus("success");
            setMessage(`Added ${paths.length} song${paths.length > 1 ? "s" : ""}`);
        } catch (e) {
            setStatus("error");
            setMessage(String(e));
        }
    };

    const browse = async () => {
        const selected = await open({
            multiple: true,
            filters: [{ name: "Audio", extensions: ["mp3", "wav", "flac", "ogg"] }],
        });
        if (!selected) return;
        importFiles(Array.isArray(selected) ? selected : [selected]);
    };

    return (
        <div className="flex flex-col gap-4">
            <div
                onClick={browse}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    // NOTE: e.dataTransfer.files gives browser File objects with no real filesystem
                    // path in a webview context. Dropping onto a Tauri window generally needs the
                    // `onDragDropEvent` API from @tauri-apps/api/window instead — worth checking
                    // against your Tauri version if drag-and-drop is important to you.
                    e.preventDefault();
                    setDragOver(false);
                }}
                className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${dragOver ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20"
                    }`}
            >
                <div className="size-14 rounded-full bg-white/5 flex items-center justify-center">
                    <HardDrive className="size-6 opacity-50" />
                </div>
                <div className="text-center">
                    <p className="font-medium">Drop files here</p>
                    <p className="text-sm opacity-50 mt-1">or click to browse</p>
                </div>
            </div>

            <StatusMessage status={status} message={message} />
        </div>
    );
}

function LinkImport() {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    const isValidUrl = (() => {
        try {
            return url.length > 0 && !!new URL(url);
        } catch {
            return false;
        }
    })();

    const submit = async () => {
        if (!isValidUrl) return;
        setStatus("loading");
        try {
            // TODO: no backend command exists for this yet — URL import (downloading + decoding
            // remote audio) is a separate feature from local file import.
            await invoke("add_song_from_url", { url });
            setStatus("success");
            setMessage("Song added");
            setUrl("");
        } catch (e) {
            setStatus("error");
            setMessage(String(e));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium opacity-70">Song URL</label>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setStatus("idle"); }}
                    placeholder="https://..."
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-colors text-sm"
                />
            </div>

            <button
                onClick={submit}
                disabled={!isValidUrl || status === "loading"}
                className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
                {status === "loading" && <Loader2 className="size-4 animate-spin" />}
                Add song
            </button>

            <StatusMessage status={status} message={message} />
        </div>
    );
}

function StatusMessage({ status, message }: { status: Status; message: string }) {
    if (status === "idle" || status === "loading") return null;
    return (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${status === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
            {status === "success" ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
            {message}
        </div>
    );
}