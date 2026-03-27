/**
 * Module: src/infrastructure/firebase.ts
 * Description: Centralized Firebase initialization.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Set shorter retry times for storage to prevent long hangs on failure
storage.maxUploadRetryTime = 60000; // 60 seconds
storage.maxOperationRetryTime = 60000; // 60 seconds

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else if (error instanceof Error && error.message.includes('unavailable')) {
      console.error("Firestore is unavailable. This is often caused by Ad Blockers, Brave Shields, or strict corporate VPNs blocking the connection to firestore.googleapis.com.");
    }
    // Skip logging for other errors (like permission-denied), as this is simply a connection test.
  }
}
testConnection();
