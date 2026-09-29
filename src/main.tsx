import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from 'react-router-dom';
import Router from "./app/router";
import "./app.css"
import { FullScreenProvider } from "./components/full-screen/";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <FullScreenProvider>
        <Router />
      </FullScreenProvider>
    </HashRouter>
  </React.StrictMode>,
);
