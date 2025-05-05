import React from "react";
import { useAuth } from "../AuthContext";

export default function AuthDebug() {
  const { currentUser } = useAuth();

  return (
    <div>
      <h3>Auth Debug</h3>
      {currentUser ? (
        <p>Logged in as: {currentUser.email}</p>
      ) : (
        <p>Not logged in.</p>
      )}
    </div>
  );
}
