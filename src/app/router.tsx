import { Route, Routes } from "react-router-dom";

import Layout from "./layout";
import Home from "./pages/home";
import Library from "./pages/library";
import Playlist from "./pages/playlist";
import Account from "./pages/account";
import Add from "./pages/add";
import Songs from "./pages/songs";
import Settings from "./pages/settings";


export default function Router() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="library" element={<Library />} />
                <Route path="songs" element={<Songs />} />
                <Route path="playlist" element={<Playlist />} />
                <Route path="playlist/:id" element={<Playlist />} />
                <Route path="account" element={<Account />} />,
                <Route path="settings" element={<Settings />} />
                <Route path="add" element={<Add />} />
                <Route path="*" element={<Home />} />
            </Route>
        </Routes>
    );
}