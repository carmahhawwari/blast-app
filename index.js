// src/index.js
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function Root() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider value={{ currentUser }}>
      <App />
    </AuthProvider>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Root />);
