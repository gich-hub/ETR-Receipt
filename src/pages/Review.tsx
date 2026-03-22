import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { OCRResult } from '@/lib/gemini';
import { saveReceipt, getReceipt, deleteReceipt, Receipt } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Persona } from './Home';

export function Review() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { image: File; ocrData: OCRResult; persona?: Persona } | null;

  const [formData, setFormData] = useState<Partial<Receipt>>({
    merchantName: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    currency: 'USD',
    category: 'Meals',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingReceipt, setExistingReceipt] = useState<Receipt | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadExistingReceipt(id);
    } else if (state) {
      loadNewReceipt(state);
    } else {
      navigate('/');
    }
  }, [id, state, navigate]);

  const loadNewReceipt = (state: { image: File; ocrData: OCRResult }) => {
    const url = URL.createObjectURL(state.image);
    setImagePreview(url);
    setFormData(prev => ({
      ...prev,
      ...state.ocrData,
      date: state.ocrData.date || new Date().toISOString().split('T')[0]
    }));
    return () => URL.revokeObjectURL(url);
  };

  const loadExistingReceipt = async (receiptId: string) => {
    setIsLoading(true);
    try {
      const receipt = await getReceipt(receiptId);
      if (!receipt) {
        alert("Receipt not found");
        navigate('/');
        return;
      }
      setExistingReceipt(receipt);
      setFormData(receipt);
      
      if (receipt.imageUrl) {
        setImagePreview(receipt.imageUrl);
      } else if (receipt.imageBlob) {
        const url = URL.createObjectURL(receipt.imageBlob);
        setImagePreview(url);
      }
      
    } catch (error) {
      console.error("Failed to load receipt", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const receiptToSave: Receipt = {
        id: existingReceipt?.id || uuidv4(),
        imageBlob: state?.image, // Only send new image if we just scanned it
        imageUrl: existingReceipt?.imageUrl,
        merchantName: formData.merchantName || 'Unknown',
        date: formData.date || new Date().toISOString().split('T')[0],
        totalAmount: Number(formData.totalAmount) || 0,
        currency: formData.currency || 'USD',
        category: formData.category || 'Other',
        status: existingReceipt?.status || 'pending',
        createdAt: existingReceipt?.createdAt || Date.now(),
      };

      await saveReceipt(receiptToSave);
      
      if (state?.persona?.phone) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2500);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save receipt");
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReceipt || !confirm("Are you sure you want to delete this receipt?")) return;
    try {
      await deleteReceipt(existingReceipt.id);
      navigate('/');
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white space-y-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Receipt Saved!</h2>
        <p className="text-gray-500 text-center max-w-xs">
          Successfully sent to {state?.persona?.name} at <br/>
          <span className="font-semibold text-gray-900">{state?.persona?.phone}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{id ? 'Edit Receipt' : 'Review Scan'}</h1>
        </div>
        <div className="flex gap-2">
          {id && (
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Image Preview */}
        <div className="rounded-xl overflow-hidden border bg-gray-100 shadow-inner max-h-[300px] flex items-center justify-center relative group">
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Receipt" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-gray-400">No Image</div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Activity</label>
            <Input 
              value={formData.merchantName} 
              onChange={e => setFormData({...formData, merchantName: e.target.value})}
              placeholder="e.g. Starbucks, Client Dinner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input 
                type="date"
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Meals</option>
                <option>Transport</option>
                <option>Lodging</option>
                <option>Supplies</option>
                <option>Entertainment</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <Input 
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value})}
                placeholder="USD"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.totalAmount} 
                onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                className="text-lg font-semibold"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

