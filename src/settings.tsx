import React from "react";
import ReactDOM from "react-dom/client";
import Settings from "./app/pages/settings";
import "./app.css"
import { ColorProvider } from "./app/data/color-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ColorProvider>
            <Settings />
        </ColorProvider>
    </React.StrictMode>
)