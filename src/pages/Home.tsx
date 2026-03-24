import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Camera, FileText, Search, Building2, ChevronRight, Edit2, Save, X, Menu, Image as ImageIcon, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getReceipts, Receipt } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';

import imageCompression from 'browser-image-compression';

export interface Persona {
  id: string;
  name: string;
  kraPin: string;
  phone: string;
}

export function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<Persona | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPersona) {
      if (!file.type.startsWith('image/')) {
        navigate('/scan', { state: { persona: selectedPersona, autoProcessFile: file } });
      } else {
        try {
          setIsCompressing(true);
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          navigate('/scan', { state: { persona: selectedPersona, autoProcessFile: compressedFile } });
        } catch (error) {
          console.error('Error compressing image:', error);
          navigate('/scan', { state: { persona: selectedPersona, autoProcessFile: file } });
        } finally {
          setIsCompressing(false);
        }
      }
    }
    // Clear the input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadReceipts();
    loadPersonas();
  }, []);

  function loadPersonas() {
    const saved = localStorage.getItem('receipt_vault_personas');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPersonas(parsed);
      if (parsed.length > 0) {
        setSelectedPersona(parsed[0]);
      } else {
        setEditForm({ id: uuidv4(), name: '', kraPin: '', phone: '' });
        setIsCreating(true);
      }
    } else {
      setEditForm({ id: uuidv4(), name: '', kraPin: '', phone: '' });
      setIsCreating(true);
    }
  }

  async function loadReceipts() {
    try {
      const data = await getReceipts();
      setReceipts(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to load receipts", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = () => {
    setEditForm(selectedPersona);
    setIsEditing(true);
    setIsCreating(false);
    setShowDeleteConfirm(false);
  };

  const handleCreateClick = () => {
    setEditForm({ id: uuidv4(), name: '', kraPin: '', phone: '' });
    setIsCreating(true);
    setIsEditing(false);
    setIsMobileMenuOpen(false);
    setShowDeleteConfirm(false);
  };

  const handleSavePersona = () => {
    if (!editForm) return;
    
    let updatedPersonas;
    if (isCreating) {
      updatedPersonas = [...personas, editForm];
    } else {
      updatedPersonas = personas.map(p => p.id === editForm.id ? editForm : p);
    }
    
    setPersonas(updatedPersonas);
    setSelectedPersona(editForm);
    localStorage.setItem('receipt_vault_personas', JSON.stringify(updatedPersonas));
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    if (personas.length === 0) {
      // Cannot cancel if there are no personas
      return;
    }
    setIsEditing(false);
    setIsCreating(false);
    setShowDeleteConfirm(false);
    if (!selectedPersona && personas.length > 0) {
      setSelectedPersona(personas[0]);
    }
  };

  const handleDeletePersona = () => {
    if (!editForm) return;
    const updatedPersonas = personas.filter(p => p.id !== editForm.id);
    setPersonas(updatedPersonas);
    localStorage.setItem('receipt_vault_personas', JSON.stringify(updatedPersonas));
    setIsEditing(false);
    setShowDeleteConfirm(false);
    if (updatedPersonas.length > 0) {
      setSelectedPersona(updatedPersonas[0]);
    } else {
      setSelectedPersona(null);
      setIsCreating(true);
    }
  };

  const filteredReceipts = useMemo(() => {
    if (!selectedPersona) return receipts;
    return receipts.filter(r => r.buyerPin === selectedPersona.kraPin);
  }, [receipts, selectedPersona]);

  const groupedReceipts = useMemo(() => {
    const groups: Record<string, Receipt[]> = {};
    filteredReceipts.forEach(receipt => {
      const date = new Date(receipt.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(receipt);
    });
    return groups;
  }, [filteredReceipts]);

  const pendingCount = useMemo(() => {
    return filteredReceipts.filter(r => r.status === 'pending').length;
  }, [filteredReceipts]);

  const showReconciliationAlert = useMemo(() => {
    const today = new Date();
    return today.getDate() < 20 && pendingCount > 0;
  }, [pendingCount]);

  if (!selectedPersona && !isCreating) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-72 bg-white border-r flex flex-col flex-shrink-0 shadow-xl md:shadow-sm z-30 transition-transform duration-300 ease-in-out transform",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">ETR Receipt</h1>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Persona</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50" onClick={handleCreateClick}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {personas.map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  setSelectedPersona(persona);
                  setIsEditing(false);
                  setIsCreating(false);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-center gap-3",
                  selectedPersona?.id === persona.id && !isCreating
                    ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100" 
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  selectedPersona?.id === persona.id && !isCreating ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-semibold truncate", selectedPersona?.id === persona.id && !isCreating ? "text-blue-900" : "text-gray-900")}>
                    {persona.name}
                  </div>
                  <div className={cn("text-xs mt-0.5 font-mono", selectedPersona?.id === persona.id && !isCreating ? "text-blue-700" : "text-gray-500")}>
                    PIN: {persona.kraPin}
                  </div>
                </div>
                {selectedPersona?.id === persona.id && !isCreating && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-gray-50/50 w-full">
        <header className="bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4 sticky top-0 z-10 flex items-center justify-between md:justify-end">
          <div className="flex items-center gap-3 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6 text-gray-700" />
            </Button>
            <span className="font-bold text-gray-900">ETR Receipt</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
          {/* Persona Hero */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 text-center space-y-6 md:space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            {!isEditing && !isCreating && selectedPersona && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-blue-600"
                onClick={handleEditClick}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}

            {(isEditing || isCreating) && editForm ? (
              <div className="max-w-md mx-auto space-y-4 text-left">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold">{isCreating ? 'Create Persona' : 'Edit Persona'}</h3>
                  {personas.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Official Entity Name</label>
                  <Input 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="e.g. Acme Corporation Ltd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                  <Input 
                    value={editForm.kraPin} 
                    onChange={e => setEditForm({...editForm, kraPin: e.target.value})}
                    className="font-mono uppercase"
                    placeholder="e.g. P051234567Z"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (For Auto-Send)</label>
                  <Input 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="+254700000000"
                  />
                </div>
                
                {showDeleteConfirm ? (
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-red-600 font-medium text-center bg-red-50 p-2 rounded-md">Are you sure you want to delete this persona?</p>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={handleDeletePersona} className="flex-1">
                        Yes, Delete
                      </Button>
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 flex gap-2">
                    <Button 
                      onClick={handleSavePersona} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!editForm.name || !editForm.kraPin}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? 'Create Persona' : 'Save Changes'}
                    </Button>
                    {!isCreating && (
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3" 
                        onClick={() => setShowDeleteConfirm(true)}
                        title="Delete Persona"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedPersona ? (
              <>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                  <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left">
                    <div className="space-y-1 md:space-y-2">
                      <h2 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Official Entity Name</h2>
                      <h3 className="text-xl md:text-2xl font-medium text-gray-800">{selectedPersona.name}</h3>
                      {selectedPersona.phone && (
                        <p className="text-xs md:text-sm text-gray-500">Auto-send to: {selectedPersona.phone}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1 md:space-y-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">KRA PIN</div>
                      <div className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-gray-900 font-mono break-all px-2 md:px-0">
                        {selectedPersona.kraPin}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <QRCodeSVG value={selectedPersona.kraPin} size={140} level="M" includeMargin={false} />
                    <span className="text-xs text-gray-400 mt-3 font-medium uppercase tracking-wider">Scan KRA PIN</span>
                  </div>
                </div>

                <div className="pt-4 md:pt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-8 text-base md:text-lg rounded-full shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:active:scale-100 disabled:hover:-translate-y-0"
                  >
                    {isCompressing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 animate-spin" /> : <Camera className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />}
                    {isCompressing ? 'Processing...' : 'Scan Receipt'}
                  </Button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleFileUpload} 
                  />
                  <Button 
                    variant="outline"
                    size="lg" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-8 text-base md:text-lg rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-70 disabled:active:scale-100 disabled:hover:-translate-y-0"
                  >
                    {isCompressing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 animate-spin" /> : <ImageIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />}
                    {isCompressing ? 'Processing...' : 'Upload from Gallery'}
                  </Button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* Missing Receipt Alert */}
          {showReconciliationAlert && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Reconciliation Reminder</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You have {pendingCount} receipt{pendingCount !== 1 ? 's' : ''} pending reconciliation. Please review and sync them before the 20th of the month deadline.
                </p>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Dashboard</h2>
              <Link to="/export" className="text-sm text-blue-600 font-medium hover:underline">
                Export All
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No receipts yet</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedReceipts).map(([monthYear, monthReceipts]: [string, Receipt[]]) => (
                  <div key={monthYear} className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-2 border-l-2 border-blue-500">{monthYear}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {monthReceipts.map((receipt) => (
                        <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-all border-gray-200">
                          <Link to={`/receipt/${receipt.id}`}>
                            <div className="flex items-center p-3 md:p-4 gap-3 md:gap-4">
                              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border">
                                 {receipt.imageUrl ? (
                                   <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
                                 ) : (
                                   <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">{receipt.merchantName || "Unknown Merchant"}</h3>
                                <p className="text-xs md:text-sm text-gray-500 truncate">{receipt.category} • {receipt.date}</p>
                              </div>
                              <div className="text-right">
                                <span className="block font-bold text-sm md:text-base text-gray-900">
                                  {receipt.currency} {receipt.totalAmount.toFixed(2)}
                                </span>
                                <span className={cn(
                                  "inline-block mt-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                  receipt.status === 'synced' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {receipt.status === 'synced' ? 'Synced' : 'Local'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Support Footer */}
        <footer className="py-6 mt-auto border-t border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-center">
            <a 
              href="https://wa.me/254115624747" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-900 hover:text-blue-700 transition-colors font-medium bg-white px-5 py-2.5 rounded-full border border-blue-100 shadow-sm hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Support: +254 115 624747
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
