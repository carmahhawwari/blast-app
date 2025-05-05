// src/AuthContext.js
import React, { createContext, useContext } from "react"; // ✅ only this line

const AuthContext = createContext();

export function AuthProvider({ children, value }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
