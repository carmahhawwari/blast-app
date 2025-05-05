import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function BlastSender() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [friends, setFriends] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      const q = query(collection(db, 'friends'), where('user', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const fetchedFriends = querySnapshot.docs.map(doc => doc.data().friend);
      setFriends(fetchedFriends);
    };

    fetchFriends();
  }, []);

  const handleSendBlast = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'blasts'), {
        title,
        content,
        sender: auth.currentUser.email,
        recipients,
        timestamp: new Date(),
      });
      setMessage('Blast sent!');
      setTitle('');
      setContent('');
      setRecipients([]);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-container">
      <h2>Send a Blast</h2>
      <form onSubmit={handleSendBlast}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        /><br />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        /><br />
        <label>Select Friends:</label><br />
        <select
          multiple
          value={recipients}
          onChange={(e) =>
            setRecipients(Array.from(e.target.selectedOptions, (opt) => opt.value))
          }
        >
          {friends.map((email, index) => (
            <option key={index} value={email}>
              {email}
            </option>
          ))}
        </select><br /><br />
        <button type="submit">Send Blast</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
