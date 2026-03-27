import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Scan } from '@/pages/Scan';
import { Review } from '@/pages/Review';
import { Export } from '@/pages/Export';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { LogIn, Receipt } from 'lucide-react';

function AppContent() {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Receipt className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ETR Receipt</h1>
            <p className="text-gray-500">Securely scan, store, and manage your business receipts with Google Cloud backup.</p>
          </div>
          <Button 
            onClick={signIn} 
            size="lg" 
            className="w-full h-14 rounded-2xl text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1"
          >
            <LogIn className="w-5 h-5 mr-3" />
            Sign in with Google
          </Button>
          <p className="text-xs text-gray-400">By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/review" element={<Review />} />
      <Route path="/receipt/:id" element={<Review />} />
      <Route path="/export" element={<Export />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
