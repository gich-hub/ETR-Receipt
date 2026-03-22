export interface Receipt {
  id: string;
  imageBlob?: Blob; // Local only, before upload
  imageUrl?: string; // Remote
  merchantName: string;
  date: string;
  totalAmount: number;
  currency: string;
  category: string;
  status: 'pending' | 'synced';
  createdAt: number;
  ownerId?: string;
}

export async function saveReceipt(receipt: Receipt) {
  const formData = new FormData();
  formData.append('id', receipt.id);
  formData.append('merchantName', receipt.merchantName);
  formData.append('date', receipt.date);
  formData.append('totalAmount', receipt.totalAmount.toString());
  formData.append('currency', receipt.currency);
  formData.append('category', receipt.category);
  formData.append('status', 'synced');
  formData.append('createdAt', receipt.createdAt.toString());
  
  if (receipt.imageBlob) {
    // Append the image blob with a filename
    formData.append('image', receipt.imageBlob, `receipt-${receipt.id}.jpg`);
  }

  const response = await fetch('/api/receipts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to save receipt to backend');
  }
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
