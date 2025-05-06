import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export default function Sent() {
  const { currentUser } = useAuth();
  const [sentBlasts, setSentBlasts] = useState([]);

  useEffect(() => {
    const fetchSentBlasts = async () => {
      if (!currentUser) return;
      const snapshot = await getDocs(collection(db, "users", currentUser.uid, "blasts"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSentBlasts(data);
    };

    fetchSentBlasts();
  }, [currentUser]);

  return (
    <div>
      <h2>Sent Blasts</h2>
      {sentBlasts.length === 0 ? (
        <p>You haven’t sent any blasts.</p>
      ) : (
        <ul>
          {sentBlasts.map((blast) => (
            <li key={blast.id}>
              <strong>{blast.title}</strong> - {blast.message}<br />
              To: {blast.recipients?.join(", ")} on {blast.date} at {blast.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
