// src/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login successful!");
      navigate("/home"); // or wherever your home page is
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log In</h1>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Log In</button>
        <p>{message}</p>
        <p style={{ marginTop: "10px" }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "100px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "280px"
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#f1f5ff"
  },
  button: {
    padding: "10px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

