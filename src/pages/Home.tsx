import React, { useEffect, useState } from 'react';
import { Camera, FileText, Search, Building2, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getReceipts, Receipt } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface Persona {
  id: string;
  name: string;
  kraPin: string;
  phone: string;
}

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'p1', name: 'Acme Corporation Ltd', kraPin: 'P051234567Z', phone: '+1234567890' },
  { id: 'p2', name: 'Global Tech Solutions', kraPin: 'P059876543X', phone: '' },
  { id: 'p3', name: 'John Doe Enterprises', kraPin: 'A001122334Y', phone: '' },
];

export function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Persona | null>(null);

  useEffect(() => {
    loadReceipts();
    loadPersonas();
  }, []);

  function loadPersonas() {
    const saved = localStorage.getItem('receipt_vault_personas');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPersonas(parsed);
      setSelectedPersona(parsed[0]);
    } else {
      setPersonas(DEFAULT_PERSONAS);
      setSelectedPersona(DEFAULT_PERSONAS[0]);
      localStorage.setItem('receipt_vault_personas', JSON.stringify(DEFAULT_PERSONAS));
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
  };

  const handleSavePersona = () => {
    if (!editForm) return;
    const updatedPersonas = personas.map(p => p.id === editForm.id ? editForm : p);
    setPersonas(updatedPersonas);
    setSelectedPersona(editForm);
    localStorage.setItem('receipt_vault_personas', JSON.stringify(updatedPersonas));
    setIsEditing(false);
  };

  if (!selectedPersona) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r flex flex-col flex-shrink-0 shadow-sm z-20">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">ReceiptVault</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Select Persona</h2>
          <div className="space-y-2">
            {personas.map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  setSelectedPersona(persona);
                  setIsEditing(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-center gap-3",
                  selectedPersona.id === persona.id 
                    ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100" 
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  selectedPersona.id === persona.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-semibold truncate", selectedPersona.id === persona.id ? "text-blue-900" : "text-gray-900")}>
                    {persona.name}
                  </div>
                  <div className={cn("text-xs mt-0.5 font-mono", selectedPersona.id === persona.id ? "text-blue-700" : "text-gray-500")}>
                    PIN: {persona.kraPin}
                  </div>
                </div>
                {selectedPersona.id === persona.id && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-gray-50/50">
        <header className="bg-white/80 backdrop-blur-md border-b px-8 py-4 sticky top-0 z-10 flex items-center justify-end">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
        </header>

        <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Persona Hero */}
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 text-gray-400 hover:text-blue-600"
                onClick={handleEditClick}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}

            {isEditing && editForm ? (
              <div className="max-w-md mx-auto space-y-4 text-left">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Edit Persona</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Official Entity Name</label>
                  <Input 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                  <Input 
                    value={editForm.kraPin} 
                    onChange={e => setEditForm({...editForm, kraPin: e.target.value})}
                    className="font-mono uppercase"
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
                <div className="pt-4">
                  <Button onClick={handleSavePersona} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Official Entity Name</h2>
                  <h3 className="text-2xl font-medium text-gray-800">{selectedPersona.name}</h3>
                  {selectedPersona.phone && (
                    <p className="text-sm text-gray-500">Auto-send to: {selectedPersona.phone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">KRA PIN</div>
                  <div className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 font-mono">
                    {selectedPersona.kraPin}
                  </div>
                </div>

                <div className="pt-8">
                  <Link to="/scan" state={{ persona: selectedPersona }}>
                    <Button size="lg" className="h-16 px-8 text-lg rounded-full shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-1 bg-blue-600 hover:bg-blue-700">
                      <Camera className="w-6 h-6 mr-3" />
                      Scan Receipt
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Recent Submissions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
              <Link to="/export" className="text-sm text-blue-600 font-medium hover:underline">
                Export All
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No receipts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receipts.map((receipt) => (
                  <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-all border-gray-200">
                    <Link to={`/receipt/${receipt.id}`}>
                      <div className="flex items-center p-4 gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border">
                           {receipt.imageUrl ? (
                             <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
                           ) : (
                             <FileText className="w-6 h-6 text-gray-400" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{receipt.merchantName || "Unknown Merchant"}</h3>
                          <p className="text-sm text-gray-500 truncate">{receipt.category} • {receipt.date}</p>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-900">
                            {receipt.currency} {receipt.totalAmount.toFixed(2)}
                          </span>
                          <span className={cn(
                            "inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
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
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
