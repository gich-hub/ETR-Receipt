import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Receipt {
  id: string;
  imageBlob?: Blob; // Local only, before upload
  imageUrl?: string; // Remote
  merchantName: string;
  merchantKraPin?: string;
  invoiceNumber?: string;
  date: string;
  totalTaxableAmount?: number;
  totalTax?: number;
  totalAmount: number;
  currency: string;
  category: string;
  buyerName?: string;
  buyerPin?: string;
  cuInvoiceNumber?: string;
  status: 'pending' | 'synced';
  createdAt: number;
  ownerId?: string;
}

export async function saveReceipt(receipt: Receipt, phone?: string): Promise<string | undefined> {
  let finalImageUrl = receipt.imageUrl;

  if (receipt.imageBlob) {
    try {
      const storageRef = ref(storage, `receipts/${receipt.id}.jpg`);
      await uploadBytes(storageRef, receipt.imageBlob);
      finalImageUrl = await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Failed to upload image to Firebase Storage:', error);
      throw new Error('Failed to upload image to cloud storage');
    }
  }

  const formData = new FormData();
  formData.append('id', receipt.id);
  formData.append('merchantName', receipt.merchantName);
  if (receipt.merchantKraPin) formData.append('merchantKraPin', receipt.merchantKraPin);
  if (receipt.invoiceNumber) formData.append('invoiceNumber', receipt.invoiceNumber);
  formData.append('date', receipt.date);
  if (receipt.totalTaxableAmount !== undefined) formData.append('totalTaxableAmount', receipt.totalTaxableAmount.toString());
  if (receipt.totalTax !== undefined) formData.append('totalTax', receipt.totalTax.toString());
  formData.append('totalAmount', receipt.totalAmount.toString());
  formData.append('currency', receipt.currency);
  formData.append('category', receipt.category);
  if (receipt.buyerName) formData.append('buyerName', receipt.buyerName);
  if (receipt.buyerPin) formData.append('buyerPin', receipt.buyerPin);
  if (receipt.cuInvoiceNumber) formData.append('cuInvoiceNumber', receipt.cuInvoiceNumber);
  formData.append('status', 'synced');
  formData.append('createdAt', receipt.createdAt.toString());
  if (phone) formData.append('phone', phone);
  
  if (finalImageUrl) {
    formData.append('imageUrl', finalImageUrl);
  }

  const response = await fetch('/api/receipts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to save receipt to backend');
  }

  return finalImageUrl;
}

export async function getReceipts(): Promise<Receipt[]> {
  const response = await fetch('/api/receipts');
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  return response.json();
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  // The backend doesn't have a specific GET /:id yet, so we fetch all and filter
  // Alternatively, we could add a GET /api/receipts/:id endpoint.
  const receipts = await getReceipts();
  return receipts.find(r => r.id === id) || null;
}

export async function deleteReceipt(id: string) {
  const response = await fetch(`/api/receipts/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete receipt');
  }
}
