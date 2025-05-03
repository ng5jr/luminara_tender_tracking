import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GuestNotifications from "./pages/guest notifications/GuestNotifications";
import MapPage from "./pages/map/MapPage";
import Rating from "./pages/rating page/rating";
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestNotifications />} />
        <Route path="/map" element={<MapPage />} /> 
        <Route path="/feedback" element={<Rating />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
