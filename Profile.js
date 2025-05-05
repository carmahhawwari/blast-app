// src/Profile.js
import React from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import "./Profile.css";

export default function Profile() {
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login"; // or use useNavigate
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="profile-container">
      <img
        src={user?.photoURL || "https://via.placeholder.com/100"}
        alt="Profile"
        className="profile-pic"
      />
      <h2>{user?.displayName || "User"}</h2>
      <p>{user?.email}</p>
      <button onClick={handleLogout}>Sign Out</button>
    </div>
  );
}
