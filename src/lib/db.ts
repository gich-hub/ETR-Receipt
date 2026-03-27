import { storage, db, auth } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

export interface Receipt {
  id: string;
  imageBlob?: Blob; // Local only, before upload
  imageUrl?: string; // Remote
  merchantName: string;
  merchantKraPin?: string;
  date: string;
  totalTaxableAmount?: number;
  totalTax?: number;
  totalAmount: number;
  currency: string;
  category: string;
  buyerPin?: string;
  cuInvoiceNumber?: string;
  status: 'pending' | 'synced';
  createdAt: number;
  ownerId: string;
}

export async function saveReceipt(receipt: Receipt, phone?: string): Promise<string | undefined> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  let imageUrl = receipt.imageUrl || '';

  // 1. Upload image to Storage if a new blob exists
  if (receipt.imageBlob) {
    const storageRef = ref(storage, `users/${user.uid}/receipts/${receipt.id}.jpg`);
    const snapshot = await uploadBytes(storageRef, receipt.imageBlob);
    imageUrl = await getDownloadURL(snapshot.ref);
  }

  // 2. Save metadata to Firestore
  const receiptData = {
    ...receipt,
    imageUrl,
    ownerId: user.uid,
    status: 'synced' as const,
  };
  
  // Remove imageBlob before saving to Firestore
  delete (receiptData as any).imageBlob;

  const receiptRef = doc(db, 'users', user.uid, 'receipts', receipt.id);
  await setDoc(receiptRef, receiptData);

  // 3. Optional: Sync to legacy backend if needed, or just return the URL
  // For now, we'll just return the Firestore-hosted image URL
  return imageUrl;
}

export async function getReceipts(): Promise<Receipt[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const receiptsRef = collection(db, 'users', user.uid, 'receipts');
  const q = query(receiptsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Receipt);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const receiptRef = doc(db, 'users', user.uid, 'receipts', id);
  const docSnap = await getDoc(receiptRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as Receipt;
  }
  return null;
}

export async function deleteReceipt(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const receiptRef = doc(db, 'users', user.uid, 'receipts', id);
  await deleteDoc(receiptRef);
}
