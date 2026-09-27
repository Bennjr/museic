import { Route, Routes } from "react-router-dom";

import Layout from "./layout";
import Home from "./pages/home";
import Library from "./pages/library";
import Playlist from "./pages/playlist";
import Account from "./pages/account";

export default function Router() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="library" element={<Library />} />
                <Route path="playlist" element={<Playlist />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<Home />} />
            </Route>
        </Routes>
    );
}