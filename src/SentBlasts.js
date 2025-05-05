import React, { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function SentBlasts() {
  const [blasts, setBlasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSentBlasts = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!currentUser?.uid) {
          return;
        }

        // Get user's document to check sent blasts
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const sentBlastIds = userData.sentBlasts || [];

        if (sentBlastIds.length === 0) {
          setBlasts([]);
          return;
        }

        // Fetch all sent blasts
        const blastsData = [];
        for (const blastId of sentBlastIds) {
          const blastDoc = await getDoc(doc(db, "blasts", blastId));
          if (blastDoc.exists()) {
            const blastData = blastDoc.data();
            
            // Get recipient details
            const recipientDetails = [];
            for (const recipientId of blastData.recipients) {
              const recipientDoc = await getDoc(doc(db, "users", recipientId));
              if (recipientDoc.exists()) {
                const recipientData = recipientDoc.data();
                recipientDetails.push({
                  id: recipientId,
                  name: recipientData.name,
                  email: recipientData.email,
                  isAttending: blastData.attending?.includes(recipientId) || false,
                  isNotAttending: blastData.notAttending?.includes(recipientId) || false
                });
              }
            }

            blastsData.push({
              id: blastDoc.id,
              ...blastData,
              recipients: recipientDetails
            });
          }
        }

        // Sort blasts by timestamp, most recent first
        blastsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setBlasts(blastsData);
      } catch (error) {
        console.error("Error fetching sent blasts:", error);
        setError("Failed to load sent blasts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentBlasts();
  }, [currentUser?.uid]);

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
        <div style={styles.loading}>Loading sent blasts...</div>
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
          <h2 style={styles.emptyStateTitle}>No Sent Blasts</h2>
          <p style={styles.emptyStateText}>When you send blasts, they'll appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Sent Blasts</h2>
      </div>
      <div style={styles.blastList}>
        {blasts.map((blast) => (
          <div key={blast.id} style={styles.blastCard}>
            <div style={styles.blastHeader}>
              <div style={styles.blastInfo}>
                <h3 style={styles.blastTitle}>{blast.title}</h3>
                <span style={styles.timestamp}>{formatDate(blast.timestamp)}</span>
              </div>
            </div>
            
            <div style={styles.blastContent}>
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

            <div style={styles.recipientsSection}>
              <h4 style={styles.sectionTitle}>Responses</h4>
              <div style={styles.recipientsList}>
                {blast.recipients.map((recipient) => (
                  <div key={recipient.id} style={styles.recipientItem}>
                    <div style={styles.recipientInfo}>
                      <div style={styles.avatar}>
                        {recipient.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.recipientDetails}>
                        <span style={styles.recipientName}>{recipient.name}</span>
                        <span style={styles.recipientEmail}>{recipient.email}</span>
                      </div>
                    </div>
                    <div style={styles.responseStatus}>
                      {recipient.isAttending ? (
                        <span style={styles.attendingStatus}>Going ✓</span>
                      ) : recipient.isNotAttending ? (
                        <span style={styles.notAttendingStatus}>Can't Go ✗</span>
                      ) : (
                        <span style={styles.pendingStatus}>No Response</span>
                      )}
                    </div>
                  </div>
                ))}
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
  blastInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  blastTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#262626',
    margin: 0
  },
  timestamp: {
    fontSize: '12px',
    color: '#8e8e8e'
  },
  blastContent: {
    padding: '16px'
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
  recipientsSection: {
    padding: '16px',
    borderTop: '1px solid #dbdbdb'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#262626',
    margin: '0 0 12px 0'
  },
  recipientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  recipientItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#fafafa',
    borderRadius: '4px'
  },
  recipientInfo: {
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
  recipientDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  recipientName: {
    fontWeight: '600',
    color: '#262626',
    fontSize: '14px'
  },
  recipientEmail: {
    fontSize: '12px',
    color: '#8e8e8e'
  },
  responseStatus: {
    fontSize: '14px',
    fontWeight: '500'
  },
  attendingStatus: {
    color: '#0095f6'
  },
  notAttendingStatus: {
    color: '#ed4956'
  },
  pendingStatus: {
    color: '#8e8e8e'
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

export default SentBlasts; 