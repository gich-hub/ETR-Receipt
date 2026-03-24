import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { OCRResult } from '@/lib/gemini';
import { saveReceipt, getReceipt, getReceipts, deleteReceipt, Receipt } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Trash2, Loader2, CheckCircle2, AlertCircle, ArrowRight, X, Maximize2, TrendingUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Persona } from './Home';

export function Review() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { image: File; ocrData: OCRResult; persona?: Persona } | null;

  const [formData, setFormData] = useState<Partial<Receipt>>({
    merchantName: '',
    merchantKraPin: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    totalTaxableAmount: undefined,
    totalTax: undefined,
    totalAmount: 0,
    currency: 'USD',
    category: 'Meals',
    buyerName: '',
    buyerPin: '',
    scuSignature: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingReceipt, setExistingReceipt] = useState<Receipt | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(null);
  const [savedReceiptUrl, setSavedReceiptUrl] = useState<string | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);

  useEffect(() => {
    if (id) {
      loadExistingReceipt(id);
    } else if (state) {
      const cleanup = loadNewReceipt(state);
      return cleanup;
    } else {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.merchantName?.trim()) newErrors.merchantName = "Merchant Name is required";
    
    const kraPinRegex = /^[PA]\d{9}[A-Z]$/i;
    if (!formData.merchantKraPin?.trim()) {
      newErrors.merchantKraPin = "Merchant KRA PIN is required";
    } else if (!kraPinRegex.test(formData.merchantKraPin)) {
      newErrors.merchantKraPin = "Invalid KRA PIN format (e.g. P123456789A)";
    }

    if (!formData.date) newErrors.date = "Date is required";
    
    if (formData.totalTaxableAmount !== undefined && formData.totalTaxableAmount !== null && formData.totalTaxableAmount !== '') {
      if (isNaN(Number(formData.totalTaxableAmount))) {
        newErrors.totalTaxableAmount = "Must be numeric";
      } else if (Number(formData.totalTaxableAmount) < 0) {
        newErrors.totalTaxableAmount = "Must be positive";
      }
    }

    if (formData.totalTax !== undefined && formData.totalTax !== null && formData.totalTax !== '') {
      if (isNaN(Number(formData.totalTax))) {
        newErrors.totalTax = "Must be numeric";
      } else if (Number(formData.totalTax) < 0) {
        newErrors.totalTax = "Must be positive";
      }
    }

    if (formData.totalAmount === undefined || formData.totalAmount === null || formData.totalAmount === '' || isNaN(Number(formData.totalAmount))) {
      newErrors.totalAmount = "Required (numeric)";
    } else if (Number(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Must be greater than 0";
    }

    if (!formData.cuInvoiceNumber?.trim()) newErrors.cuInvoiceNumber = "Control Unit Invoice Number is required";

    if (formData.buyerPin?.trim() && !kraPinRegex.test(formData.buyerPin)) {
      newErrors.buyerPin = "Invalid KRA PIN format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeSave = async () => {
    setIsSaving(true);
    setShowWarningModal(false);
    try {
      const receiptToSave: Receipt = {
        id: existingReceipt?.id || uuidv4(),
        imageBlob: state?.image, // Only send new image if we just scanned it
        imageUrl: existingReceipt?.imageUrl,
        merchantName: formData.merchantName || 'Unknown',
        merchantKraPin: formData.merchantKraPin,
        invoiceNumber: formData.invoiceNumber,
        date: formData.date || new Date().toISOString().split('T')[0],
        totalTaxableAmount: (formData.totalTaxableAmount !== undefined && formData.totalTaxableAmount !== null && formData.totalTaxableAmount !== '') ? Number(formData.totalTaxableAmount) : undefined,
        totalTax: (formData.totalTax !== undefined && formData.totalTax !== null && formData.totalTax !== '') ? Number(formData.totalTax) : undefined,
        totalAmount: Number(formData.totalAmount) || 0,
        currency: formData.currency || 'USD',
        category: formData.category || 'Other',
        buyerName: formData.buyerName,
        buyerPin: formData.buyerPin,
        cuInvoiceNumber: formData.cuInvoiceNumber,
        status: existingReceipt?.status || 'pending',
        createdAt: existingReceipt?.createdAt || Date.now(),
      };

      const finalImageUrl = await saveReceipt(receiptToSave, state?.persona?.phone);
      
      setSavedReceiptId(receiptToSave.id);
      if (finalImageUrl) setSavedReceiptUrl(finalImageUrl);
      
      // Calculate monthly total
      try {
        const allReceipts = await getReceipts();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const userReceipts = allReceipts.filter(r => {
          const rDate = new Date(r.date);
          const isCurrentMonth = rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
          // If a persona is selected, filter by their PIN, otherwise just use all receipts
          const matchesUser = state?.persona?.kraPin ? (r.buyerPin === state.persona.kraPin) : true;
          return isCurrentMonth && matchesUser;
        });
        
        const total = userReceipts.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
        setMonthlyTotal(total);
        setMonthlyCount(userReceipts.length);
      } catch (err) {
        console.error("Failed to calculate monthly total", err);
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to save", error);
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!validate()) {
      setShowWarningModal(true);
      return;
    }
    executeSave();
  };

  const executeDelete = async () => {
    if (!existingReceipt) return;
    try {
      await deleteReceipt(existingReceipt.id);
      navigate('/');
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  if (showSuccess) {
    const baseUrl = process.env.APP_URL || window.location.origin;
    const receiptUrl = savedReceiptUrl || `${baseUrl}/receipt/${savedReceiptId}`;
    const phone = state?.persona?.phone ? state.persona.phone.replace(/\D/g, '') : '';
    const message = `🧾 *New Receipt Scanned*\n\n*Merchant:* ${formData.merchantName}\n*Date:* ${formData.date}\n*Amount:* ${formData.currency} ${formData.totalAmount}\n*Category:* ${formData.category}\n*KRA PIN:* ${formData.merchantKraPin || 'N/A'}\n\nView Receipt: ${receiptUrl}`;
    
    // If phone is provided, send to that specific number, otherwise just open whatsapp sharing
    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white space-y-6 px-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Receipt Saved!</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Your receipt has been successfully saved to your vault.
          </p>
        </div>
        
        <div className="w-full max-w-xs bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-medium mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">This Month's Total</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formData.currency || 'KES'} {monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-blue-600/80 font-medium">
            Across {monthlyCount} receipt{monthlyCount === 1 ? '' : 's'}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-xs pt-2">
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 h-12 rounded-xl text-base shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1"
            onClick={() => window.open(waUrl, '_blank')}
          >
            Forward via WhatsApp
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl text-base"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isMissing = (val: any) => val === undefined || val === null || val === '';

  const Label = ({ children, field }: { children: React.ReactNode, field: string }) => {
    const hasError = !!errors[field];
    const missing = isMissing(formData[field as keyof Receipt]) && hasError;
    return (
      <label className={`block text-xs md:text-sm font-medium mb-1 flex items-center gap-1 ${hasError ? 'text-red-600' : 'text-gray-700'}`}>
        {children}
        {hasError && <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />}
      </label>
    );
  };

  const ErrorMsg = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return <p className="text-[10px] md:text-xs text-red-600 mt-1">{errors[field]}</p>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </Link>
          <h1 className="text-base md:text-lg font-semibold">{id ? 'Edit Receipt' : 'Review Scan'}</h1>
        </div>
        <div className="flex gap-2">
          {id && (
            <Button variant="destructive" size="icon" onClick={handleDeleteClick} className="w-8 h-8 md:w-10 md:h-10">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8 md:h-10 text-xs md:text-sm">
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Save
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 max-w-2xl mx-auto w-full">
        {/* Image Preview */}
        <div 
          className="rounded-xl overflow-hidden border bg-gray-100 shadow-inner h-[200px] md:h-[300px] flex items-center justify-center relative group cursor-pointer"
          onClick={() => imagePreview && setShowEnlargedImage(true)}
        >
          {imagePreview ? (
            <>
              <img 
                src={imagePreview} 
                alt="Receipt" 
                className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-sm md:text-base">No Image</div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label field="merchantName">Merchant Name</Label>
              <Input 
                value={formData.merchantName || ''} 
                onChange={e => {
                  setFormData({...formData, merchantName: e.target.value});
                  if (errors.merchantName) setErrors(prev => ({...prev, merchantName: ''}));
                }}
                placeholder="e.g. Starbucks"
                className={`h-10 md:h-11 ${errors.merchantName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="merchantName" />
            </div>
            <div>
              <Label field="merchantKraPin">Merchant KRA PIN</Label>
              <Input 
                value={formData.merchantKraPin || ''} 
                onChange={e => {
                  setFormData({...formData, merchantKraPin: e.target.value});
                  if (errors.merchantKraPin) setErrors(prev => ({...prev, merchantKraPin: ''}));
                }}
                placeholder="e.g. P123456789A"
                className={`h-10 md:h-11 ${errors.merchantKraPin ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="merchantKraPin" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label field="invoiceNumber">Invoice/Receipt Number</Label>
              <Input 
                value={formData.invoiceNumber || ''} 
                onChange={e => {
                  setFormData({...formData, invoiceNumber: e.target.value});
                  if (errors.invoiceNumber) setErrors(prev => ({...prev, invoiceNumber: ''}));
                }}
                placeholder="e.g. INV-001"
                className={`h-10 md:h-11 ${errors.invoiceNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="invoiceNumber" />
            </div>
            <div>
              <Label field="date">Date</Label>
              <Input 
                type="date"
                value={formData.date || ''} 
                onChange={e => {
                  setFormData({...formData, date: e.target.value});
                  if (errors.date) setErrors(prev => ({...prev, date: ''}));
                }}
                className={`h-10 md:h-11 ${errors.date ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="date" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="flex h-10 md:h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formData.category || 'Other'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label field="totalTaxableAmount">Total Taxable Amount</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.totalTaxableAmount === undefined ? '' : formData.totalTaxableAmount} 
                onChange={e => {
                  setFormData({...formData, totalTaxableAmount: e.target.value});
                  if (errors.totalTaxableAmount) setErrors(prev => ({...prev, totalTaxableAmount: ''}));
                }}
                className={`h-10 md:h-11 ${errors.totalTaxableAmount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="totalTaxableAmount" />
            </div>
            <div>
              <Label field="totalTax">Total Tax</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.totalTax === undefined ? '' : formData.totalTax} 
                onChange={e => {
                  setFormData({...formData, totalTax: e.target.value});
                  if (errors.totalTax) setErrors(prev => ({...prev, totalTax: ''}));
                }}
                className={`h-10 md:h-11 ${errors.totalTax ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="totalTax" />
            </div>
            <div>
              <Label field="totalAmount">Total Amount</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.totalAmount === undefined ? '' : formData.totalAmount} 
                onChange={e => {
                  setFormData({...formData, totalAmount: e.target.value});
                  if (errors.totalAmount) setErrors(prev => ({...prev, totalAmount: ''}));
                }}
                className={`h-10 md:h-11 font-semibold ${errors.totalAmount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="totalAmount" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label field="buyerName">Buyer Name</Label>
              <Input 
                value={formData.buyerName || ''} 
                onChange={e => setFormData({...formData, buyerName: e.target.value})}
                className="h-10 md:h-11"
              />
            </div>
            <div>
              <Label field="buyerPin">Buyer PIN</Label>
              <Input 
                value={formData.buyerPin || ''} 
                onChange={e => {
                  setFormData({...formData, buyerPin: e.target.value});
                  if (errors.buyerPin) setErrors(prev => ({...prev, buyerPin: ''}));
                }}
                className={`h-10 md:h-11 ${errors.buyerPin ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <ErrorMsg field="buyerPin" />
            </div>
          </div>

          <div>
            <Label field="cuInvoiceNumber">Control Unit Invoice Number</Label>
            <Input 
              value={formData.cuInvoiceNumber || ''} 
              onChange={e => {
                setFormData({...formData, cuInvoiceNumber: e.target.value});
                if (errors.cuInvoiceNumber) setErrors(prev => ({...prev, cuInvoiceNumber: ''}));
              }}
              className={`h-10 md:h-11 font-mono text-xs ${errors.cuInvoiceNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            <ErrorMsg field="cuInvoiceNumber" />
          </div>

        </div>
      </main>

      {/* Enlarged Image Modal */}
      {showEnlargedImage && imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" 
          onClick={() => setShowEnlargedImage(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 bg-black/50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowEnlargedImage(false);
              }}
            >
              <X className="w-6 h-6" />
            </Button>
            <img 
              src={imagePreview} 
              alt="Enlarged Receipt" 
              className="max-w-full max-h-full object-contain select-none" 
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 text-yellow-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Missing Information</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Some fields are missing or invalid. Are you sure you want to skip them and save anyway?
            </p>
            <ul className="text-sm text-red-600 mb-6 space-y-1 list-disc pl-5 max-h-32 overflow-y-auto">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field}><span className="font-semibold">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>: {msg}</li>
              ))}
            </ul>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowWarningModal(false)}>
                Go Back & Fix
              </Button>
              <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={executeSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Skip & Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Delete Receipt</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete this receipt? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

