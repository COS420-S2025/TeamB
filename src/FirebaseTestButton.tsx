import React, { useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase-config.tsx';

/**
 * Writes a single document to Firestore. Firebase is loaded only on click
 * so tests and cold start do not initialize the SDK.
 */
type FirebaseTestButtonProps = {
  userEmail: string;
  events: Array<{
    id: string;
    iCalData: string;
    importance: number;
  }>;
};

export function FirebaseTestButton({ userEmail, events }: FirebaseTestButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!userEmail) {
      window.alert('No signed-in email found.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        email: userEmail,
        events,
        updatedAt: serverTimestamp()
      };

      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', userEmail),
        limit(1)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        const existingDocRef = doc(db, 'users', existingUserSnapshot.docs[0].id);
        await setDoc(existingDocRef, payload);
        window.alert('Existing user record overwritten in Firestore.');
      } else {
        await addDoc(collection(db, 'users'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        window.alert('New user record created in Firestore.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Firestore error';
      window.alert(`Failed to save to Firestore: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button type="button" className="firebase-test-button" onClick={handleSave} disabled={isSaving}>
      Test Firebase (Firestore)
    </button>
  );
}
