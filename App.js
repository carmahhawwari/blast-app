import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { AuthProvider, useAuth } from "./AuthContext";

import LoginPage from "./Login";
import SignupPage from "./SignupPage";
import Home from "./HomePage";
import AddFriends from "./AddFriends";
import CreateBlast from "./CreateBlast";
import Sent from "./Sent";
import Profile from "./Profile";
import Layout from "./Layout";
import BlastInbox from "./BlastInbox";
import FriendRequests from "./FriendRequests";
import SentBlasts from "./SentBlasts";
import NavBar from "./NavBar";

function App() {
  const { currentUser } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) return <div>Loading...</div>;

  return (
    <AuthProvider value={{ currentUser }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!currentUser ? <SignupPage /> : <Navigate to="/home" />} />

          {/* Protected routes with NavBar layout */}
          <Route path="/" element={currentUser ? <Layout /> : <Navigate to="/login" />}>
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="addfriends" element={<AddFriends />} />
            <Route path="create" element={<CreateBlast />} />
            <Route path="inbox" element={<BlastInbox />} />
            <Route path="friend-requests" element={<FriendRequests />} />
            <Route path="sent-blasts" element={<SentBlasts />} />
            <Route index element={<Navigate to="/home" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
