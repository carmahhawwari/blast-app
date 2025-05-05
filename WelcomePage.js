// src/WelcomePage.js
import React from "react";
import { Link } from "react-router-dom";
import "./WelcomePage.css";

export default function WelcomePage() {
  return (
    <div className="welcome-container">
      <h1>Welcome to BLAST</h1>
      <p>Let's get started</p>
      <div className="welcome-buttons">
        <Link to="/login">
          <button className="welcome-btn">Log In</button>
        </Link>
        <Link to="/signup">
          <button className="welcome-btn">Sign Up</button>
        </Link>
      </div>
    </div>
  );
}
