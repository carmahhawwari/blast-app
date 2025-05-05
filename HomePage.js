// src/HomePage.js
import React, { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function HomePage() {
  const [receivedBlasts, setReceivedBlasts] = useState([]);
  const [sentBlasts, setSentBlasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchBlasts = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!currentUser?.uid) {
          return;
        }

        // Get user's document
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        
        // Fetch received blasts
        const receivedBlastIds = userData.receivedBlasts || [];
        const receivedBlastsData = [];
        for (const blastId of receivedBlastIds) {
          const blastDoc = await getDoc(doc(db, "blasts", blastId));
          if (blastDoc.exists()) {
            const blastData = blastDoc.data();
            receivedBlastsData.push({
              id: blastDoc.id,
              ...blastData,
              isAttending: blastData.attending?.includes(currentUser.uid) || false,
              isNotAttending: blastData.notAttending?.includes(currentUser.uid) || false
            });
          }
        }

        // Fetch sent blasts
        const sentBlastIds = userData.sentBlasts || [];
        const sentBlastsData = [];
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

            sentBlastsData.push({
              id: blastDoc.id,
              ...blastData,
              recipients: recipientDetails
            });
          }
        }

        // Sort both arrays by timestamp
        receivedBlastsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        sentBlastsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setReceivedBlasts(receivedBlastsData);
        setSentBlasts(sentBlastsData);
      } catch (error) {
        console.error("Error fetching blasts:", error);
        setError("Failed to load blasts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlasts();
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

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Received Blasts</h2>
        {receivedBlasts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>No received blasts yet</p>
          </div>
        ) : (
          <div style={styles.blastList}>
            {receivedBlasts.map((blast) => (
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sent Blasts</h2>
        {sentBlasts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>No sent blasts yet</p>
          </div>
        ) : (
          <div style={styles.blastList}>
            {sentBlasts.map((blast) => (
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
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '16px',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    '@media (max-width: 768px)': {
      padding: '12px'
    }
  },
  section: {
    marginBottom: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.05)',
    '@media (max-width: 768px)': {
      marginBottom: '24px'
    }
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '20px',
    padding: '16px 20px',
    borderBottom: '1px solid #e0e7ff',
    '@media (max-width: 768px)': {
      fontSize: '18px',
      padding: '12px 16px'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#3b82f6',
    fontSize: '16px'
  },
  error: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #dbeafe'
  },
  blastList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '0 20px 20px',
    '@media (max-width: 768px)': {
      padding: '0 12px 12px',
      gap: '12px'
    }
  },
  blastCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e0e7ff',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
    }
  },
  blastHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e7ff',
    backgroundColor: '#ffffff',
    '@media (max-width: 768px)': {
      padding: '12px 16px'
    }
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  blastInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '8px'
    }
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
    '@media (max-width: 768px)': {
      width: '36px',
      height: '36px',
      fontSize: '14px'
    }
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  username: {
    fontWeight: '600',
    color: '#1e40af',
    fontSize: '15px',
    '@media (max-width: 768px)': {
      fontSize: '14px'
    }
  },
  timestamp: {
    fontSize: '13px',
    color: '#6b7280',
    '@media (max-width: 768px)': {
      fontSize: '12px'
    }
  },
  blastContent: {
    padding: '20px',
    '@media (max-width: 768px)': {
      padding: '16px'
    }
  },
  blastTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e40af',
    margin: '0 0 12px 0',
    lineHeight: '1.4',
    '@media (max-width: 768px)': {
      fontSize: '16px'
    }
  },
  blastMessage: {
    fontSize: '15px',
    color: '#374151',
    margin: '0 0 16px 0',
    lineHeight: '1.6',
    '@media (max-width: 768px)': {
      fontSize: '14px'
    }
  },
  blastDetails: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e0e7ff',
    '@media (max-width: 768px)': {
      padding: '12px'
    }
  },
  detailItem: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '@media (max-width: 768px)': {
      fontSize: '13px'
    }
  },
  detailLabel: {
    fontWeight: '600',
    color: '#1e40af',
    minWidth: '60px'
  },
  recipientsSection: {
    padding: '20px',
    borderTop: '1px solid #e0e7ff',
    backgroundColor: '#f8fafc',
    '@media (max-width: 768px)': {
      padding: '16px'
    }
  },
  recipientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    '@media (max-width: 768px)': {
      gap: '8px'
    }
  },
  recipientItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e0e7ff',
    transition: 'transform 0.2s ease',
    '@media (max-width: 768px)': {
      padding: '10px',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '8px'
    }
  },
  recipientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  recipientDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  recipientName: {
    fontWeight: '600',
    color: '#1e40af',
    fontSize: '14px',
    '@media (max-width: 768px)': {
      fontSize: '13px'
    }
  },
  recipientEmail: {
    fontSize: '13px',
    color: '#6b7280',
    '@media (max-width: 768px)': {
      fontSize: '12px'
    }
  },
  responseStatus: {
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '20px',
    '@media (max-width: 768px)': {
      fontSize: '13px',
      padding: '4px 10px'
    }
  },
  attendingStatus: {
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    padding: '6px 12px',
    borderRadius: '20px'
  },
  notAttendingStatus: {
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px'
  },
  pendingStatus: {
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e0e7ff',
    margin: '0 20px 20px',
    '@media (max-width: 768px)': {
      padding: '32px 16px',
      margin: '0 12px 12px'
    }
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: '15px',
    margin: 0,
    '@media (max-width: 768px)': {
      fontSize: '14px'
    }
  }
};

export default HomePage;
