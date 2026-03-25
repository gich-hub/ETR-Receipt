import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  ownerId?: string;
}

export async function saveReceipt(receipt: Receipt, phone?: string): Promise<string | undefined> {
  const formData = new FormData();
  
  // Add all fields to FormData
  formData.append('id', receipt.id);
  formData.append('merchantName', receipt.merchantName);
  if (receipt.merchantKraPin) formData.append('merchantKraPin', receipt.merchantKraPin);
  formData.append('date', receipt.date);
  if (receipt.totalTaxableAmount !== undefined) formData.append('totalTaxableAmount', receipt.totalTaxableAmount.toString());
  if (receipt.totalTax !== undefined) formData.append('totalTax', receipt.totalTax.toString());
  formData.append('totalAmount', receipt.totalAmount.toString());
  formData.append('currency', receipt.currency);
  formData.append('category', receipt.category);
  if (receipt.buyerPin) formData.append('buyerPin', receipt.buyerPin);
  if (receipt.cuInvoiceNumber) formData.append('cuInvoiceNumber', receipt.cuInvoiceNumber);
  formData.append('status', 'synced');
  formData.append('createdAt', receipt.createdAt.toString());
  if (phone) formData.append('phone', phone);
  if (receipt.imageUrl) formData.append('imageUrl', receipt.imageUrl);

  // If we have a new image blob, append it as 'image'
  if (receipt.imageBlob) {
    formData.append('image', receipt.imageBlob, `${receipt.id}.jpg`);
  }

  const response = await fetch('/api/receipts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save receipt to backend');
  }

  const result = await response.json();
  // The backend returns the imageFilename. We construct the full URL.
  const baseUrl = window.location.origin;
  return result.imageFilename ? `${baseUrl}/api/images/${result.imageFilename}` : undefined;
}

export async function getReceipts(): Promise<Receipt[]> {
  const response = await fetch('/api/receipts');
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  return response.json();
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const response = await fetch(`/api/receipts/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('Failed to fetch receipt');
  }
  return response.json();
}

export async function deleteReceipt(id: string) {
  const response = await fetch(`/api/receipts/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete receipt');
  }
}
