/**
 * Module: src/infrastructure/database/FirestoreProvider.ts
 * Description: Implementation of IDatabaseProvider using Firebase Firestore and Storage.
 */

import { collection, getDocs, query, doc, getDoc, deleteDoc, setDoc, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { IDatabaseProvider } from '@/domain/interfaces';
import { Receipt, Persona } from '@/domain/entities';
import { AppLogger } from '@/utils/logger';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class FirestoreProvider implements IDatabaseProvider {
  /**
   * Saves a receipt to Firestore and uploads its image to Storage.
   * @param receipt - The receipt entity to save.
   * @returns A promise that resolves to the final image URL.
   */
  async saveReceipt(receipt: Receipt): Promise<string> {
    let finalImageUrl = receipt.imageUrl || '';
    const path = `users/${receipt.ownerId}/receipts/${receipt.id}`;

    try {
      // 1. Upload image if a blob is provided
      if (receipt.imageBlob) {
        const sizeMB = receipt.imageBlob.size / 1024 / 1024;
        AppLogger.info(`Uploading image to storage: receipts/${receipt.ownerId}/${receipt.id} (${sizeMB.toFixed(2)} MB)`);
        const storageRef = ref(storage, `receipts/${receipt.ownerId}/${receipt.id}`);
        
        try {
          // Use uploadBytesResumable for better robustness and progress tracking
          const uploadTask = uploadBytesResumable(storageRef, receipt.imageBlob);
          
          // Add a timeout for the upload operation (90 seconds)
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Storage upload timeout after 90s")), 90000)
          );

          // Monitor progress for debugging
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (progress % 25 === 0) { // Log every 25%
                AppLogger.info(`Upload progress: ${progress.toFixed(0)}%`);
              }
            },
            (error) => {
              AppLogger.error("Upload task failed", error);
            }
          );

          await Promise.race([uploadTask, timeoutPromise]);
          finalImageUrl = await getDownloadURL(storageRef);
          AppLogger.info("Image upload successful", { finalImageUrl });
        } catch (uploadError: any) {
          AppLogger.error("Storage upload failed", uploadError);
          // If it's a retry limit error, it's likely a network or configuration issue
          if (uploadError.code === 'storage/retry-limit-exceeded') {
            throw new Error(JSON.stringify({
              error: "Storage upload failed due to network or configuration issues. Please ensure Firebase Storage is enabled and rules are deployed.",
              operationType: 'write',
              path: `receipts/${receipt.ownerId}/${receipt.id}`
            }));
          }
          throw uploadError;
        }
      }

      // 2. Prepare Firestore document
      const { imageBlob, ...receiptData } = receipt;
      const docRef = doc(db, `users/${receipt.ownerId}/receipts`, receipt.id);
      
      await setDoc(docRef, {
        ...receiptData,
        imageUrl: finalImageUrl,
        status: 'synced'
      });

      return finalImageUrl;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return ''; // Should not reach here
    }
  }

  /**
   * Retrieves stats for the current month.
   * @param ownerId - The user ID.
   * @returns A promise that resolves to { total: number, count: number }.
   */
  async getMonthlyStats(ownerId: string): Promise<{ total: number, count: number }> {
    const path = `users/${ownerId}/receipts`;
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      // Query receipts from the start of the month
      const q = query(
        collection(db, path),
        where('date', '>=', firstDayOfMonth)
      );
      
      const snapshot = await getDocs(q);
      const receipts = snapshot.docs.map(doc => doc.data() as Receipt);
      
      const total = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
      return { total, count: receipts.length };
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return { total: 0, count: 0 };
    }
  }

  /**
   * Retrieves all receipts for a specific owner.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves to an array of receipts.
   */
  async getReceipts(ownerId: string): Promise<Receipt[]> {
    const path = `users/${ownerId}/receipts`;
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Receipt);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  }

  /**
   * Retrieves a single receipt by its ID.
   * @param receiptId - The unique identifier of the receipt.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves to the receipt or null if not found.
   */
  async getReceipt(receiptId: string, ownerId: string): Promise<Receipt | null> {
    const path = `users/${ownerId}/receipts/${receiptId}`;
    try {
      const docRef = doc(db, `users/${ownerId}/receipts`, receiptId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Receipt) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  }

  /**
   * Deletes a receipt from Firestore and its image from Storage.
   * @param receiptId - The unique identifier of the receipt.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteReceipt(receiptId: string, ownerId: string): Promise<void> {
    const path = `users/${ownerId}/receipts/${receiptId}`;
    try {
      // 1. Delete image from Storage
      try {
        const storageRef = ref(storage, `receipts/${ownerId}/${receiptId}`);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("Image not found in storage, skipping deletion", e);
      }

      // 2. Delete document from Firestore
      const docRef = doc(db, `users/${ownerId}/receipts`, receiptId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  /**
   * Saves a persona.
   * @param persona - The persona entity to save.
   * @returns A promise that resolves when the save is complete.
   */
  async savePersona(persona: Persona): Promise<void> {
    const path = `users/${persona.ownerId}/personas/${persona.id}`;
    try {
      const docRef = doc(db, `users/${persona.ownerId}/personas`, persona.id);
      await setDoc(docRef, persona);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  /**
   * Deletes a persona.
   * @param personaId - The ID of the persona.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deletePersona(personaId: string, ownerId: string): Promise<void> {
    const path = `users/${ownerId}/personas/${personaId}`;
    try {
      const docRef = doc(db, `users/${ownerId}/personas`, personaId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  /**
   * Subscribes to personas for a user.
   * @param ownerId - The ID of the user.
   * @param callback - The callback function to handle persona updates.
   * @returns An unsubscribe function.
   */
  subscribeToPersonas(ownerId: string, callback: (personas: Persona[]) => void): () => void {
    const path = `users/${ownerId}/personas`;
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const personas = snapshot.docs.map(doc => doc.data() as Persona);
      callback(personas);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
}
