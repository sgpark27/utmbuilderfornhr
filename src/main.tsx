import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { ChannelProvider } from "./channelContext";
import App from "./App";
import AdminPage from "./pages/AdminPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChannelProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ChannelProvider>
  </StrictMode>
);
