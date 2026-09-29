import { Routes, Route } from "react-router-dom";
import { useTab } from "@components/tab-provider";

import Home from "../../app/pages/home";
import Library from "../../app/pages/library";
import Playlist from "../../app/pages/playlist";
import Account from "../../app/pages/account";
import Add from "../../app/pages/add";

export default function TabContent() {
    const { path } = useTab();

    return (
        <div className="h-full overflow-y-auto">
            <Routes location={path}>
                <Route index element={<Home />} />
                <Route path="library" element={<Library />} />
                <Route path="/playlist/:id" element={<Playlist />} />
                <Route path="account" element={<Account />} />
                <Route path="/add" element={<Add />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </div>
    );
}