import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function AddFriends() {
  const [nameInput, setNameInput] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users);
    };

    const fetchSentRequests = async () => {
      const requestsQuery = query(
        collection(db, "friendRequests"),
        where("senderId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(requestsQuery);
      const requests = querySnapshot.docs.map(doc => doc.data().receiverId);
      setSentRequests(requests);
    };

    fetchUsers();
    fetchSentRequests();
  }, [currentUser.uid]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNameInput(value);
  
    const suggestions = allUsers.filter(
      user =>
        user.name &&
        user.name.toLowerCase().includes(value.toLowerCase()) &&
        user.id !== currentUser.uid &&
        !sentRequests.includes(user.id)
    );
  
    setFilteredSuggestions(suggestions);
  };

  const handleAddFriend = async (friend) => {
    try {
      // Create a new friend request
      await addDoc(collection(db, "friendRequests"), {
        senderId: currentUser.uid,
        receiverId: friend.id,
        status: "pending",
        timestamp: new Date().toISOString()
      });

      // Update sent requests state
      setSentRequests([...sentRequests, friend.id]);
      
      alert(`Friend request sent to ${friend.name}!`);
      setNameInput("");
      setFilteredSuggestions([]);
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request. Please try again.");
    }
  };

  return (
    <div>
      <h1>Add Friends</h1>
      <input
        placeholder="Search for friends..."
        value={nameInput}
        onChange={handleInputChange}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      {filteredSuggestions.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredSuggestions.map((user) => (
            <li
              key={user.id}
              style={{
                padding: "6px",
                border: "1px solid #ccc",
                marginBottom: "4px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{user.name} ({user.email})</span>
              <button
                onClick={() => handleAddFriend(user)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Send Request
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddFriends;
