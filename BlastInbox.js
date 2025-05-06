import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function BlastInbox() {
  const [blasts, setBlasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchBlasts = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!currentUser?.uid) {
          console.log("No current user found");
          return;
        }

        console.log("Fetching blasts for user:", currentUser.uid);

        // Get user's document to check received blasts
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        console.log("User data:", userData);
        
        const receivedBlastIds = userData.receivedBlasts || [];
        console.log("Received blast IDs:", receivedBlastIds);

        if (receivedBlastIds.length === 0) {
          console.log("No received blasts found");
          setBlasts([]);
          return;
        }

        // Fetch all received blasts
        const blastsData = [];
        for (const blastId of receivedBlastIds) {
          console.log("Fetching blast:", blastId);
          const blastDoc = await getDoc(doc(db, "blasts", blastId));
          if (blastDoc.exists()) {
            const blastData = blastDoc.data();
            console.log("Blast data:", blastData);
            blastsData.push({
              id: blastDoc.id,
              ...blastData,
              isAttending: blastData.attending?.includes(currentUser.uid) || false,
              isNotAttending: blastData.notAttending?.includes(currentUser.uid) || false
            });
          } else {
            console.log("Blast document not found:", blastId);
          }
        }

        console.log("All fetched blasts:", blastsData);

        // Sort blasts by timestamp, most recent first
        blastsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setBlasts(blastsData);
      } catch (error) {
        console.error("Error fetching blasts:", error);
        setError("Failed to load blasts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlasts();
  }, [currentUser?.uid]);

  const handleResponse = async (blastId, response) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Handling response for blast:", blastId);
      console.log("Response type:", response);

      const blastRef = doc(db, "blasts", blastId);
      const blastDoc = await getDoc(blastRef);
      
      if (!blastDoc.exists()) {
        console.log("Blast document not found");
        setError("Blast not found");
        return;
      }

      const blastData = blastDoc.data();
      console.log("Current blast data:", blastData);

      // Get current arrays
      const currentAttending = blastData.attending || [];
      const currentNotAttending = blastData.notAttending || [];

      if (response === 'attending') {
        console.log("Processing 'attending' response");
        // Remove from notAttending if present
        if (currentNotAttending.includes(currentUser.uid)) {
          console.log("Removing from notAttending");
          await updateDoc(blastRef, {
            notAttending: arrayRemove(currentUser.uid)
          });
        }
        // Add to attending if not already present
        if (!currentAttending.includes(currentUser.uid)) {
          console.log("Adding to attending");
          await updateDoc(blastRef, {
            attending: arrayUnion(currentUser.uid),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        console.log("Processing 'notAttending' response");
        // Remove from attending if present
        if (currentAttending.includes(currentUser.uid)) {
          console.log("Removing from attending");
          await updateDoc(blastRef, {
            attending: arrayRemove(currentUser.uid)
          });
        }
        // Add to notAttending if not already present
        if (!currentNotAttending.includes(currentUser.uid)) {
          console.log("Adding to notAttending");
          await updateDoc(blastRef, {
            notAttending: arrayUnion(currentUser.uid),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Fetch the updated blast data
      const updatedBlastDoc = await getDoc(blastRef);
      const updatedBlastData = updatedBlastDoc.data();
      console.log("Updated blast data:", updatedBlastData);

      // Update local state with the fresh data
      setBlasts(prevBlasts => 
        prevBlasts.map(blast => {
          if (blast.id === blastId) {
            return {
              ...blast,
              ...updatedBlastData,
              isAttending: updatedBlastData.attending?.includes(currentUser.uid) || false,
              isNotAttending: updatedBlastData.notAttending?.includes(currentUser.uid) || false
            };
          }
          return blast;
        })
      );

    } catch (error) {
      console.error("Error updating blast response:", error);
      setError("Failed to update your response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading blasts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (blasts.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyStateTitle}>No Blasts Yet</h2>
          <p style={styles.emptyStateText}>When your friends send you blasts, they'll appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Blasts</h2>
      </div>
      <div style={styles.blastList}>
        {blasts.map((blast) => (
          <div key={blast.id} style={styles.blastCard}>
            <div style={styles.blastHeader}>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {blast.senderName.charAt(0).toUpperCase()}
                </div>
                <div style={styles.userDetails}>
                  <span style={styles.username}>{blast.senderName}</span>
                  <span style={styles.timestamp}>{formatDate(blast.timestamp)}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.blastContent}>
              <h3 style={styles.blastTitle}>{blast.title}</h3>
              <p style={styles.blastMessage}>{blast.message}</p>
              <div style={styles.blastDetails}>
                <p style={styles.detailItem}>
                  <span style={styles.detailLabel}>When:</span> {new Date(blast.datetime).toLocaleString()}
                </p>
                <p style={styles.detailItem}>
                  <span style={styles.detailLabel}>Where:</span> {blast.location}
                </p>
              </div>
            </div>

            <div style={styles.attendanceSection}>
              <div style={styles.attendanceButtons}>
                <button
                  onClick={() => handleResponse(blast.id, 'attending')}
                  style={{
                    ...styles.attendanceButton,
                    backgroundColor: blast.isAttending ? '#0095f6' : '#fafafa',
                    color: blast.isAttending ? 'white' : '#262626',
                    border: blast.isAttending ? 'none' : '1px solid #dbdbdb'
                  }}
                  disabled={isLoading}
                >
                  {blast.isAttending ? 'Going ✓' : 'Going'}
                </button>
                <button
                  onClick={() => handleResponse(blast.id, 'notAttending')}
                  style={{
                    ...styles.attendanceButton,
                    backgroundColor: blast.isNotAttending ? '#ed4956' : '#fafafa',
                    color: blast.isNotAttending ? 'white' : '#262626',
                    border: blast.isNotAttending ? 'none' : '1px solid #dbdbdb'
                  }}
                  disabled={isLoading}
                >
                  {blast.isNotAttending ? 'Can\'t Go ✓' : 'Can\'t Go'}
                </button>
              </div>
              
              <div style={styles.attendanceCounts}>
                <span style={styles.count}>
                  <span style={styles.countNumber}>{blast.attending?.length || 0}</span> Going
                </span>
                <span style={styles.count}>
                  <span style={styles.countNumber}>{blast.notAttending?.length || 0}</span> Can't Go
                </span>
              </div>
            </div>
          </div>
        ))}
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
  header: {
    padding: '16px 0',
    borderBottom: '1px solid #dbdbdb',
    marginBottom: '20px'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#262626',
    margin: 0
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
  blastList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  blastCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dbdbdb',
    overflow: 'hidden'
  },
  blastHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid #dbdbdb'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
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
    fontWeight: '600'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  username: {
    fontWeight: '600',
    color: '#262626'
  },
  timestamp: {
    fontSize: '12px',
    color: '#8e8e8e'
  },
  blastContent: {
    padding: '16px'
  },
  blastTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#262626',
    margin: '0 0 8px 0'
  },
  blastMessage: {
    fontSize: '14px',
    color: '#262626',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  blastDetails: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: '4px'
  },
  detailItem: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#262626'
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: '8px'
  },
  attendanceSection: {
    padding: '16px',
    borderTop: '1px solid #dbdbdb'
  },
  attendanceButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  attendanceButton: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  attendanceCounts: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#8e8e8e'
  },
  count: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  countNumber: {
    fontWeight: '600',
    color: '#262626'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dbdbdb'
  },
  emptyStateTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#262626',
    margin: '0 0 8px 0'
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#8e8e8e',
    margin: 0
  }
};

export default BlastInbox; 