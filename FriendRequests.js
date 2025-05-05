import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  getDoc
} from "firebase/firestore";

export default function FriendRequests() {
  const { currentUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!currentUser?.uid) {
          return;
        }

        // Query for pending friend requests where current user is the receiver
        const requestsQuery = query(
          collection(db, "friendRequests"),
          where("receiverId", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(requestsQuery);
        const requests = [];

        // Get sender information for each request
        for (const requestDoc of querySnapshot.docs) {
          const requestData = requestDoc.data();
          
          if (!requestData.senderId) {
            console.error("Request missing senderId:", requestDoc.id);
            continue;
          }

          const senderDocRef = doc(db, "users", requestData.senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          
          if (senderDocSnap.exists()) {
            const senderData = senderDocSnap.data();
            
            // Only add request if sender has required data
            if (senderData.name && senderData.email) {
              requests.push({
                id: requestDoc.id,
                senderId: requestData.senderId,
                senderName: senderData.name,
                senderEmail: senderData.email,
                timestamp: requestData.timestamp || new Date().toISOString()
              });
            } else {
              console.error("Sender missing required data:", requestData.senderId);
            }
          } else {
            console.error("Sender document not found:", requestData.senderId);
          }
        }

        setIncomingRequests(requests);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        setError("Failed to load friend requests. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomingRequests();
  }, [currentUser?.uid]);

  const handleAcceptRequest = async (request) => {
    if (!request?.senderId || !request?.senderName) {
      setError("Invalid friend request data");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Update both users' friend lists
      const currentUserRef = doc(db, "users", currentUser.uid);
      const senderUserRef = doc(db, "users", request.senderId);

      // Get current user's document to check existing friends
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();
      const currentUserFriends = currentUserData.friends || [];

      // Get sender's document to check existing friends
      const senderUserDoc = await getDoc(senderUserRef);
      const senderUserData = senderUserDoc.data();
      const senderUserFriends = senderUserData.friends || [];

      // Only update if they're not already friends
      if (!currentUserFriends.includes(request.senderId)) {
        await updateDoc(currentUserRef, {
          friends: arrayUnion(request.senderId)
        });
      }

      if (!senderUserFriends.includes(currentUser.uid)) {
        await updateDoc(senderUserRef, {
          friends: arrayUnion(currentUser.uid)
        });
      }

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", request.id));

      // Update local state
      setIncomingRequests(prev => 
        prev.filter(req => req.id !== request.id)
      );

      alert(`Friend request from ${request.senderName} accepted!`);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setError("Failed to accept friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!request?.id || !request?.senderName) {
      setError("Invalid friend request data");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", request.id));

      // Update local state
      setIncomingRequests(prev => 
        prev.filter(req => req.id !== request.id)
      );

      alert(`Friend request from ${request.senderName} rejected.`);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setError("Failed to reject friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading friend requests...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Friend Requests</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {incomingRequests.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No pending friend requests</p>
        </div>
      ) : (
        <div style={styles.requestsList}>
          {incomingRequests.map((request) => (
            <div key={request.id} style={styles.requestItem}>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {request.senderName ? request.senderName.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={styles.details}>
                  <span style={styles.name}>{request.senderName || 'Unknown User'}</span>
                  <span style={styles.email}>{request.senderEmail || 'No email available'}</span>
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  style={styles.acceptButton}
                  onClick={() => handleAcceptRequest(request)}
                  disabled={isLoading}
                >
                  Accept
                </button>
                <button
                  style={styles.rejectButton}
                  onClick={() => handleRejectRequest(request)}
                  disabled={isLoading}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  requestItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #dbdbdb'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#0095f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600'
  },
  details: {
    display: 'flex',
    flexDirection: 'column'
  },
  name: {
    fontWeight: '600',
    color: '#262626',
    fontSize: '14px'
  },
  email: {
    fontSize: '12px',
    color: '#8e8e8e'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  acceptButton: {
    padding: '8px 16px',
    backgroundColor: '#0095f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#ed4956',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
}; 