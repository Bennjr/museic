import { createContext, useContext, useState, ReactNode } from "react";

type FullScreenContext = {
    open: (content: ReactNode) => void;
    close: () => void;
    isOpen: boolean;
};

const Ctx = createContext<FullScreenContext | null>(null);

export function useFullScreen() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useFullScreen must be used inside FullScreenProvider");
    return ctx;
}

export function FullScreenProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ReactNode>(null);

    const open = (node: ReactNode) => setContent(node);
    const close = () => setContent(null);

    return (
        <Ctx.Provider value={{ open, close, isOpen: content !== null }}>
            {children}
            {content && (
                <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-200">
                    {content}
                </div>
            )}
        </Ctx.Provider>
    );
}