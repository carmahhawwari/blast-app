import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  arrayUnion
} from "firebase/firestore";

export default function CreateBlast() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [datetime, setDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!currentUser?.uid) {
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.error("User document not found");
          setError("Failed to load user data");
          return;
        }

        const userData = userDocSnap.data();
        const friendIDs = userData.friends || [];

        if (friendIDs.length === 0) {
          setFriends([]);
          return;
        }

        // Split friendIDs into chunks of 10 to avoid query limitations
        const chunkSize = 10;
        const friendChunks = [];
        for (let i = 0; i < friendIDs.length; i += chunkSize) {
          friendChunks.push(friendIDs.slice(i, i + chunkSize));
        }

        const allFriends = [];
        for (const chunk of friendChunks) {
          const friendsQuery = query(
            collection(db, "users"),
            where("__name__", "in", chunk)
          );
          const friendsSnapshot = await getDocs(friendsQuery);
          const chunkFriends = friendsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          allFriends.push(...chunkFriends);
        }

        setFriends(allFriends);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setError("Failed to load friends. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser?.uid]);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  const handleSendBlast = async () => {
    if (!title || !message || !datetime || !location || selectedFriends.length === 0) {
      setError("Please fill all fields and select at least one friend.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      console.log("Starting blast creation process");
      console.log("Selected friends:", selectedFriends);

      // Get current user's data
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentUserData = currentUserDoc.data();
      console.log("Current user data:", currentUserData);

      const blastData = {
        title: title.trim(),
        message: message.trim(),
        datetime,
        location: location.trim(),
        senderId: currentUser.uid,
        senderName: currentUserData.name,
        senderEmail: currentUserData.email,
        recipients: selectedFriends,
        attending: [],
        notAttending: [],
        timestamp: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log("Creating blast with data:", blastData);

      // Create the blast document
      const blastRef = await addDoc(collection(db, "blasts"), blastData);
      console.log("Blast created with ID:", blastRef.id);

      // Update each recipient's user document to include this blast
      for (const recipientId of selectedFriends) {
        console.log("Updating recipient:", recipientId);
        const recipientRef = doc(db, "users", recipientId);
        await updateDoc(recipientRef, {
          receivedBlasts: arrayUnion(blastRef.id)
        });
        console.log("Updated recipient's receivedBlasts array");
      }

      // Update sender's user document to include this blast
      const senderRef = doc(db, "users", currentUser.uid);
      await updateDoc(senderRef, {
        sentBlasts: arrayUnion(blastRef.id)
      });
      console.log("Updated sender's sentBlasts array");

      alert("Blast sent successfully!");
      setTitle("");
      setMessage("");
      setDatetime("");
      setLocation("");
      setSelectedFriends([]);
    } catch (error) {
      console.error("Error sending blast:", error);
      setError("Failed to send blast. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading friends...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create a Blast</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.form}>
        <input
          style={styles.input}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />

        <textarea
          style={styles.textarea}
          placeholder="What's the plan?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />

        <input
          style={styles.input}
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          disabled={isLoading}
        />

        <input
          style={styles.input}
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isLoading}
        />

        <div style={styles.friendsSection}>
          <h3 style={styles.sectionTitle}>Select Friends:</h3>
          {friends.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No friends found. Add friends first!</p>
            </div>
          ) : (
            <div style={styles.friendsList}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    ...styles.friendItem,
                    backgroundColor: selectedFriends.includes(friend.id) ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <div style={styles.avatar}>
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.friendInfo}>
                    <span style={styles.friendName}>{friend.name}</span>
                    <span style={styles.friendEmail}>{friend.email}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => {}}
                    style={styles.checkbox}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          style={{
            ...styles.sendButton,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onClick={handleSendBlast}
          disabled={isLoading || !title || !message || !datetime || !location || selectedFriends.length === 0}
        >
          {isLoading ? "Sending..." : "Send Blast"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fafafa'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#262626',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #dbdbdb',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #dbdbdb',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
    width: '100%',
    boxSizing: 'border-box'
  },
  friendsSection: {
    marginTop: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#262626',
    marginBottom: '12px'
  },
  friendsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #dbdbdb',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: 'white'
  },
  friendItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    gap: '12px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#0095f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600'
  },
  friendInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  friendName: {
    fontWeight: '600',
    color: '#262626',
    fontSize: '14px'
  },
  friendEmail: {
    fontSize: '12px',
    color: '#8e8e8e'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  sendButton: {
    padding: '12px',
    backgroundColor: '#0095f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#8e8e8e'
  },
  error: {
    backgroundColor: '#ed4956',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #dbdbdb'
  },
  emptyStateText: {
    color: '#8e8e8e',
    fontSize: '14px',
    margin: 0
  }
};
