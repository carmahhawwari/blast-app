// src/NavBar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <button aria-label="Home" onClick={() => navigate("/home")} className="nav-button">🏠</button>
      <button aria-label="Add Friends" onClick={() => navigate("/addfriends")} className="nav-button">👥</button>
      <button aria-label="Friend Requests" onClick={() => navigate("/friend-requests")} className="nav-button">📨</button>
      <button aria-label="Create Blast" onClick={() => navigate("/create")} className="nav-button">➕</button>
      <button aria-label="Inbox" onClick={() => navigate("/inbox")} className="nav-button">📬</button>
      <button aria-label="Profile" onClick={() => navigate("/profile")} className="nav-button">👤</button>
      <button aria-label="Sent Blasts" onClick={() => navigate("/sent-blasts")} className="nav-button">📤</button>
    </div>
  );
}
